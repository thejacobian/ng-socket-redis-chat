/* eslint-disable prefer-destructuring */
/* eslint-disable quote-props */
// Requires and Setup
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const fs = require('fs');

let creds = '';

const redis = require('redis');

let client = '';
const port = process.env.PORT || 8080;

// Express Middleware for serving static
// files and parsing the request body
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true,
}));

// Start the Server
http.listen(port, () => {
  console.log(`Server Started on ${port}`);
});

// Store people in chatroom
let chatters = [];

// Store messages in chatroom
let chat_messages = [];

// Read credentials from JSON
fs.readFile('creds.json', 'utf-8', (err, data) => {
  if (err) {
    throw err;
  }
  creds = JSON.parse(data);
  client = redis.createClient(`redis://${creds.user}:${creds.password}@${creds.host}:${creds.port}`);

  // Redis Client Ready
  client.once('ready', () => {
    // Flush Redis DB
    // client.flushdb();

    // Initialize Chatters
    client.get('chat_users', (err, reply) => {
      if (reply) {
        chatters = JSON.parse(reply);
      }
    });

    // Initialize Messages
    client.get('chat_app_messages', (err, reply) => {
      if (reply) {
        chat_messages = JSON.parse(reply);
      }
    });
  });
});

// API - Join Chat
app.post('/join', (req, res) => {
  const username = req.body.username;
  if (chatters.indexOf(username) === -1) {
    chatters.push(username);
    client.set('chat_users', JSON.stringify(chatters));
    res.send({
      'chatters': chatters,
      'status': 'OK'
    });
  } else {
    res.send({
      'status': 'FAILED'
    });
  }
});

// API - Leave Chat
app.post('/leave', (req, res) => {
  const username = req.body.username;
  chatters.splice(chatters.indexOf(username), 1);
  client.set('chat_users', JSON.stringify(chatters));
  res.send({
    'status': 'OK'
  });
});

// API - Send + Store Message
app.post('/send_message', (req, res) => {
  const username = req.body.username;
  const message = req.body.message;
  chat_messages.push({
    'sender': username,
    'message': message,
  });
  client.set('chat_app_messages', JSON.stringify(chat_messages));
  res.send({
    'status': 'OK',
  });
});

// API - Get Messages
app.get('/get_messages', (req, res) => {
  res.send(chat_messages);
});

// API - Get Chatters
app.get('/get_chatters', (req, res) => {
  res.send(chatters);
});

// Socket Connection
// UI Stuff
io.on('connection', (socket) => {

  // Fire 'send' event for updating Message list in UI
  socket.on('message', (data) => {
    io.emit('send', data);
  });

  // Fire 'count_chatters' for updating Chatter Count in UI
  socket.on('update_chatter_count', (data) => {
    io.emit('count_chatters', data);
  });
});
