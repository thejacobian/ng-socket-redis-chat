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
