$(function(){
  var
      socket = io.connect('http://localhost:3000'),
      user = null,
      channel = 'lobby-messages',
      $message_box = $('.message_box'),
      $message_field = $('#message_field'),
      $message_box_scroll = $message_box.scrollTop(),
      notification_time = 500,
      typying_notification_lock = false,
      // this calcs the size of div and scroll to newer message
      scrollMessages = function(){
        var h =$('.message-box').prop('scrollHeight');
        $('.message-box').animate({
         scrollTop: h
        }, 1000);
      },
      // Use this to append a message
      appendMessage = function(message, user, is_from_user ){
        var message_type = is_from_user ? 'user' : 'others' ,
          html = '<div class="row">';
            html += '<div class="col-md-12">';
              html += '<span class="name-';
              html += message_type;
              html +=' name-text">';
                html += user + ' says:';
              html += '</span>';
            html += '</div>';
            html += '<div class="col-md-12">';
              html += '<div class="message-ballon message-ballon-';
              html += message_type;
              html +='">';
                html += message;
              html += '</div>';
            html += '</div>';
          html += '</div>';
          $('.message-box').append(html);
          scrollMessages();
      },
      appendFriendAction = function(data, action_html){
        let element = data.action+'_'+data.user;
          if( data.action != 'stop-typing' ){
            html = '<li class="list-group-item '+element+'">';
            html += '<div class="row">';
            html += '<span class="col-md-8 friend-name">';
            html += data.user;
            html += '</span>';
            html += '<span class="col-md-4 friend-status noselect float-right">';
            html += action_html
            html += '</span>';
            html += '</div>';
            html += '</li>';
            $('.list-group').append(html);

            if( data.action != 'typing' ){
              setTimeout(function(){
                  $('.'+element).fadeOut('fast', function(){ $('.'+element).remove(); });
              }, notification_time);
            }
            return false;
          }
          $('.typing_'+data.user).remove();
      }
      sendTypingStatus = function(){
        if(typying_notification_lock){
          return false;
        }
        socket.emit('action', {action: 'typing', user: user});
        typying_notification_lock = true;
      };

  $('#message_field').focus();

  //name selection
  do{
    user = prompt('Digite um nome de usuario');
  }while(user == null || user == "");

  // setting name in frame
  $('#username_frm').text(user);

  // Subscribe channel
  socket.emit('subscribe', {channel:'lobby-system', user: user, action: 'joined'});
  socket.emit('subscribe', {channel:'lobby-messages', user: user});

  $message_field.blur(function(){
    typying_notification_lock = false;
    socket.emit('action', {user: user, action: 'stop-typing'});
  });

  $message_field.on('keypress' ,function(){
    sendTypingStatus();
  });

  // Send message callback
  $('form').submit(function(e){
    e.preventDefault(e);
    let msg = $message_field.val();

    if( msg != '' ){
      $message_field.attr('placeholder', 'Write here your message. Use enter to send.');
      socket.emit('message', {message: msg, user: user, channel: channel});
      socket.emit('action', {user: user, action: 'stop-typing'});
      typying_notification_lock = false;
      appendMessage( msg, user, true);
      $message_field.val(null);
      return false;
    }
    $message_field.attr('placeholder', 'Write a message before send.');
  });

  // Retrieve messages
  socket.on('lobby-messages', function(data){
    appendMessage( data.message, data.user, false);
  });

  // Retrieve messages
  socket.on('lobby-system', function(data){
    let action_html = '';
    console.log(data);
    switch(data.action){
      case "joined":
        action_html = '<span class="badge badge-success">Joined</span>';
      break;
      case "typing":
        action_html = '<span class="badge badge-info">Typing...</span>';
      break;
      case "left":
        action_html = '<span class="badge badge-danger">Leave</span>';
      break;
    }
    appendFriendAction(data, action_html);
  });
});
