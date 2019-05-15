const express = require('express')
const helmet = require('helmet')

const app = express()
const server = require('http').createServer(app)
const port = process.env.PORT || 3000

const io = require('socket.io')(server, {
  path: '/socket.io/chat',
  origins: ['*:*']
})


// -------------------------------------------------
// Middleware
app.use(helmet())

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  next()
})


// -------------------------------------------------
// Routes
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html')
})


// -------------------------------------------------
// Sockets
socketConns = []
socketUsers = []

io.of('/socket.io/chat').on("connection", function(socket) {
  socketConns.push(socket)
  console.log('Connected: %s Sockets Connected', socketConns.length)

  // Welcome
  socket.emit('welcome', 'Welcome to /socket.io/chat Namespace')

  // New User
  socket.on('new-user', function(user, result) {
    // Check If Username Already Exist
    if (socketUsers.indexOf(user.toLowerCase()) >= 0) {
      // If Username Already Exist Send Error Message
      result(false)
      return socket.emit('response-error', 'Error, username already exist')
    }

    // If Username not Taken Then
    // Set Username to Socket
    result(true)
    socket.user = user.toLowerCase()
    socketUsers.push(user.toLowerCase())

    // Update Users Data
    updateUsers()

    // Send Success Response Message
    socket.emit('response-success', 'You are set as user: ' + user.toLowerCase())
  })

  // Join Room
  socket.on('join-room', function(room) {
    socket.join(room.toLowerCase())

    // Send Success Response Message
    socket.emit('response-success', 'You are joined to room: ' + room.toLowerCase())
  })

  // New Message
  socket.on('new-message', function(room, message, result) {
    // Check If Room Data is Defined
    if (room === undefined) {
      // If Room is Undefined Then Send Error Message
      result(false)
      return socket.emit('response-error', 'Error, no room defined to send message')
    }

    // Check If Socket Joined The Room
    const roomIndex = Object.keys(socket.rooms).indexOf(room.toLowerCase())
    if (roomIndex > 0) {
      // If Socket is Joined The Room Then
      // Broadcast (Except Current Socket) Message to Room
      result(true)
      return socket.broadcast.to(room.toLowerCase()).emit('get-message', message)
    }

    // If Socket is Not Joined The Room Then
    // Send Error Message
    result(false)
    socket.emit('response-error', 'Error, you are not joined to room ' + room)
  })

  // Leave Room
  socket.on('leave-room', function(room) {
    socket.leave(room.toLowerCase())

    // Return Message to Namespace
    socket.emit('response-success', 'You are leaved from room: ' + room.toLowerCase())
  })

  // Disconnect
  socket.on('disconnect', function(data) {
    // Check If Socket User is Defined
    if (socket.user !== undefined) {
      // Check If Username Already Exist
      if (socketUsers.indexOf(socket.user.toLowerCase()) >= 0) {
        // If Username Already Exist Then Remove The User
        socketUsers.splice(socketUsers.indexOf(socket.user), 1)

        // Update Users Data
        updateUsers()
      }
    }

    socketConns.splice(socketConns.indexOf(socket), 1)
    console.log('Connected: %s Sockets Connected', socketConns.length)
  })

  // Function Update Users Data
  function updateUsers() {
    // Broadcast (All Sockets) Update Users Data to Namespace
    io.of('/socket.io/chat').emit('get-users', socketUsers)
  }
})


// -------------------------------------------------
// Servers
server.listen(port, function() {
  console.log('Server Started at Port ' + port)
})
