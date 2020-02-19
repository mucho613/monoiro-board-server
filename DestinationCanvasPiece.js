const { createCanvas } = require('canvas')

module.exports = class DestinationCanvasPiece {
  constructor() {
    this.canvas = createCanvas(2048, 2048);
    this.context = this.canvas.getContext('2d');
  }

  commit = action => {
    // 画像から転写する(commit される Action が全て画像変換済みの前提)
    this.context.globalAlpha = action.tool.alpha;
    this.context.globalCompositeOperation = action.tool.type === 'pen'
      ? 'source-over'
      : 'destination-out';

    if(action.image) {
      this.context.drawImage(action.image, action.left, action.top);
    } else {
      this.context.drawImage(action.canvas.getCanvasElement(), 0, 0);
    }
  }

  clear = () => this.context.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);

  initialize = image => this.context.drawImage(image, 0, 0);
}
