const { createCanvas } = require('canvas')

module.exports = class History {
  queue = [];
  socket = null;

  constructor(queueMaxLength, socket) {
    this.queueMaxLength = queueMaxLength;
    this.socket = socket;

    this.fixedImageCanvas = createCanvas(2048, 2048);
    this.fixedImageCanvasContext = this.fixedImageCanvas.getContext('2d');
  }

  actionStart = (id, tool) => {
    // Action のひな形
    const action = {
      isActive: true,
      id: id,
      tool: tool,
      stroke: [],
      image: null,
      left: 2048,
      right: 0,
      top: 2048,
      bottom: 0
    };

    // History に操作を追加する
    this.queue.push(action);

    if(this.queue.length > this.queueMaxLength) {
      const action = this.queue.shift();

      if(action.isActive) {
        this.fixedImageCanvasContext.globalAlpha = action.tool.alpha;
        this.fixedImageCanvasContext.globalCompositeOperation = action.tool.type === 'pen'
          ? 'source-over'
          : 'destination-out';

        if(action.image) {
          this.fixedImageCanvasContext.drawImage(action.image, action.left, action.top);
        }
        // HistoryQueue の終端に Action があるのに、もしも image 変換されてなかった場合は、
        // 即時的な canvas に描画してから fixedImageCanvas に描画する
        // (fixedImageCanvasContext で描画すると半透明線をうまく扱えないため)
        else if(action.stroke.length > 1) {
          const width = action.right - action.left;
          const height = action.bottom - action.top;

          const canvas = createCanvas(width, height);
          const context = canvas.getContext('2d');

          context.clearRect(0, 0, width, height);
    
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.strokeStyle = action.tool.color;
    
          for(let i = 1; i < action.stroke.length; i++) {
            const previousPoint = action.stroke[i - 1];
            const point = action.stroke[i];
            const thickness = point.force * action.tool.thicknessCoefficient;
            
            context.beginPath();
            context.lineWidth = thickness;
            context.moveTo(previousPoint.x - action.left, previousPoint.y - action.top);
            context.lineTo(point.x - action.left, point.y - action.top);
            context.stroke();
          }

          this.fixedImageCanvasContext.globalAlpha = action.tool.alpha;
          this.fixedImageCanvasContext.drawImage(canvas, action.left, action.top);
        }
      }
    }
  }

  actionUpdate = (id, point) => {
    // 直近の対象idの操作を検索して、取り出す
    const action = this.queue[this.getLatestActionIndexById(id)];
    
    if(action) {
      // Action に Stroke を追加する
      action.stroke.push(point);

      const thickness = point.force * action.tool.thicknessCoefficient

      const left = point.x - thickness;
      const right = point.x + thickness;
      const top = point.y - thickness;
      const bottom = point.y + thickness;

      if(action.left > left) action.left = left;
      if(action.right < right) action.right = right;
      if(action.top > top) action.top = top;
      if(action.bottom < bottom) action.bottom = bottom;

      if(action.left < 0) action.left = 0;
      if(action.right > 2048) action.right = 2048;
      if(action.top < 0) action.top = 0;
      if(action.bottom > 2048) action.bottom = 2048;
    }
  }

  actionEnd = id => {
    // 何もしない

    // const action = this.queue[this.getLatestActionIndexById(id)];
    
    // if(action && action.stroke.length > 1) {
    //   const width = action.right - action.left;
    //   const height = action.bottom - action.top;

    //   const canvas = createCanvas(width, height);
    //   const context = canvas.getContext('2d');

    //   canvas.width = width;
    //   canvas.height = height;

    //   context.clearRect(0, 0, width, height);

    //   context.lineCap = 'round';
    //   context.lineJoin = 'round';
    //   context.strokeStyle = action.tool.color;

    //   for(let i = 1; i < action.stroke.length; i++) {
    //     const previousPoint = action.stroke[i - 1];
    //     const point = action.stroke[i];
    //     const thickness = point.force * action.tool.thicknessCoefficient;
        
    //     context.beginPath();
    //     context.lineWidth = thickness;
    //     context.moveTo(previousPoint.x - action.left, previousPoint.y - action.top);
    //     context.lineTo(point.x - action.left, point.y - action.top);
    //     context.stroke();
    //   }

    //   action.image = canvas;
    // }
  }

  undo = id => {
    const action = this.queue[this.getLatestActionIndexById(id)];
    if(action) action.isActive = false;
    return action;
  }
  
  getLatestActionIndexById = id => {
    for(let i = this.queue.length - 1; i >= 0; i--) {
      const action = this.queue[i];
      if(action.id === id && action.isActive) return i;
    }
  }

  getFixedImageBase64 = () => this.fixedImageCanvas.toDataURL();

  getQueue = () => this.queue;
}
