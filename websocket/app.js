// load configurations from env file
require('dotenv').config({path: '../.env'})

// creating your server and listening on env port
var app = require('express')();
var http = require('http').Server(app);
var port = process.env.WEB_SOCKET_PORT || 3000
var io = require('socket.io')(http);
var fs = require('fs');
var dateformat = require('dateformat');
var log_date = Date.now();
var Log = require('log');
var message_log = new Log('message_log', fs.createWriteStream('logs/messages_log/'+ dateformat(log_date) +'.log'));
var complete_log = new Log('complete_log', fs.createWriteStream('logs/complete_log/'+ dateformat(log_date) +'.log'));

http.listen( port, function(){
  complete_log.info('Websocked listening on port: ' + port);
  console.log('Websocket listening on port: ' + port);
});

// events
io.on('connection', function(socket){
  // Actions in case of disconection
  socket.on('disconect', function(data){
      socket.broadcast.emit('lobby-system', {action: 'disconect', user: data });
        complete_log.info('User left the party ');
  });

  // If the client needs to subscribe a new channel
  socket.on('subscribe', function(data){
      // TODO validate message
      socket.join(data.channel);
      if(data.channel == 'lobby-messages'){
        socket.broadcast.emit('lobby-system', {action: 'joined', user: data.user });
      }
      complete_log.info('The user: ' + data.user + ' Join the channel: ' + data.channel);
  });

  // If the client needs to unsubscribe a new channel
  socket.on('unsubscribe', function(data){
    // TODO validate message
    socket.leave(data.channel);
    if(data.channel == 'lobby-messages'){
      socket.broadcast.emit('lobby-system', {action: 'left', user: data.user });
    }
    complete_log.info('The user: ' + data.user + ' Left the channel: ' + data.channel);
  });

  // Typing
  socket.on('action', function(data){
      // TODO validate data
      socket.broadcast.emit('lobby-system', {action: data.action, user: data.user });
  });

  // Message listening
  socket.on('message', function(data){
    // TODO validate message
    socket.broadcast.emit( data.channel, data);
    message_log.info('user: ' + data.user + ' Says: ' + data.message);
    complete_log.info('user: ' + data.user + ' Says: ' + data.message);
  });

  // Error handling
  socket.on('error', function(data){
    // TODO validate data
    socket.broadcast.emit('lobby-system', {action: 'joined', user: data.user });
    complete_log.info('Unspected Error');
  });

});
