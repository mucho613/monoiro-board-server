const fs = require('fs');

const server = require('https').createServer({
  key: fs.readFileSync(''),
  cert: fs.readFileSync('')
});
const io = require('socket.io')(server);
const PORT = process.env.PORT || 443;
server.listen(PORT);

const History = require('./History.js');
const historyQueueMaxLength = 50;
const history = new History(historyQueueMaxLength, io);

io.on('connection', socket => {
  // 新しく入ったユーザーのために、描いてたやつを送信する
  socket.emit('init', {
    historyQueue: history.getQueue()
  });
  console.log("New connection established", socket.id);

  socket.on('request fixed image', () => {
    socket.emit('fixed image', history.getFixedImageBase64());
  })

  socket.on('action start', tool => {
    socket.broadcast.emit('action start', socket.id, tool);
    history.actionStart(socket.id, tool);
  });

  socket.on('action update', attribute => {
    socket.broadcast.emit('action update', socket.id, attribute);
    history.actionUpdate(socket.id, attribute);
  });

  socket.on('action end', () => {
    socket.broadcast.emit('action end', socket.id);
    history.actionEnd(socket.id);
  });

  socket.on('undo', () => {
    socket.broadcast.emit('undo', socket.id);
    history.undo(socket.id);
  });
});
