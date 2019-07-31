const socket = io.connect();
let username = '';

$.get('/get_chatters', (response) => {
  $('.chat-info').text(`There are currently ${response.length} people in the chat room`);
  chatter_count = response.length; // update chatter count
});

$('#join-chat').click(() => {
  username = $.trim($('#username').val());
  $.ajax({
    url: '/join',
    type: 'POST',
    data: {
      username,
    },
    success(response) {
      if (response.status === 'OK') { // username doesn't already exists
        socket.emit('update_chatter_count', {
          action: 'increase',
        });
        $('.chat').show();
        $('#leave-chat').data('username', username);
        $('#send-message').data('username', username);
        $.get('/get_messages', (response) => {
          if (response.length > 0) {
            const message_count = response.length;
            let html = '';
            for (let x = 0; x < message_count; x++) {
              html += `<div class='msg'><div class='user'>${response[x].sender}:</div><div class='txt'>${response[x].message}</div></div>`;
            }
            $('.messages').html(html);
          }
        });
        $('.join-chat').hide(); // hide the container for joining the chat room.
      } else if (response.status === 'FAILED') { // username already exists
        alert('Sorry but the username already exists, please choose another one');
        $('#username').val('').focus();
      }
    },
  });
});

$('#leave-chat').click(() => {
  // const username = $(this).data('username');
  $.ajax({
    url: '/leave',
    type: 'POST',
    dataType: 'json',
    data: {
      username,
    },
    success(response) {
      if (response.status === 'OK') {
        socket.emit('message', {
          username,
          message: `${username} has left the chat room..`,
        });
        socket.emit('update_chatter_count', {
          action: 'decrease',
        });
        $('.chat').hide();
        $('.join-chat').show();
        $('#username').val('');
        alert('You have successfully left the chat room');
      }
    },
  });
});

$('#send-message').click(() => {
  // const username = $(this).data('username');
  const message = $.trim($('#message').val());
  $.ajax({
    url: '/send_message',
    type: 'POST',
    dataType: 'json',
    data: {
      username,
      message,
    },
    success(response) {
      if (response.status === 'OK') {
        socket.emit('message', {
          username,
          message,
        });
        $('#message').val('');
      }
    },
  });
});

socket.on('send', (data) => {
  username = data.username;
  const { message } = data;
  const html = `<div class='msg'><div class='user'>${username}:</div><div class='txt'>  ${message}</div></div>`;
  $('.messages').append(html);
});
socket.on('count_chatters', (data) => {
  if (data.action === 'increase') {
    chatter_count++;
  } else {
    chatter_count--;
  }
  $('.chat-info').text(`There are currently ${chatter_count} people in the chat room`);
});
