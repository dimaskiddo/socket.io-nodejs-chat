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

app.use(express.urlencoded({ 
  extended: false,
  limit: '8mb'
}))

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  next()
})
// -------------------------------------------------

// -------------------------------------------------
// Routes
app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html")
})
// -------------------------------------------------

// -------------------------------------------------
// Sockets
socketConns = []
socketUsers = []

io.of('/socket.io/chat').on("connection", function(socket) {
  socketConns.push(socket)
  console.log('Connected: %s sockets connected', socketConns.length)

  // Welcome
  socket.emit('welcome', "Welcome to /socket.io/chat Namespace")

  // New User
  socket.on('new-user', function(data) {
    // Set Username
    socket.username = data
    socketUser.push(data)
  })

  // Join Room
  socket.on('join-room', function(data) {
    socket.join(data)

    // Broadcast Message to Room
    io.of('/socket.io/chat').to(data).emit('get-message', 'User '+socket.username+' Has Joined The Room')

    // Return Message to Namespace
    socket.emit('success', 'You are Joined to Room: ' + data)
  })

  // New Message
  socket.on('new-message', function(data) {
    // Check If Room Data is Set
    // If Not Set then Send Error Message
    if (data.room !== undefined) {
      return socket.emit('error', 'Error, You are Not Joined to Any Room. Can Not Sent Message.')
    } else if (socket.room.indexOf(data.room) >= 0) {
      // If Room Data is Exist in Joined Room then Send the Message
      return io.of('/socket.io/chat').to(data.room).emit('get-message', data.message)
    }

    // Send Error Message, If Not Yet Joined to The Rom
    socket.emit('error', 'Error, You are Not Joined to Room ' + data.room + '. Can Not Sent Message to The Room.')
  })

  // Leave Room
  socket.on('leave-room', function(data) {
    socket.leave(data)

    // Broadcast Message to Room
    io.of('/socket.io/chat').to(data).emit('get-message', 'User '+socket.username+' Has Leaving The Room')

    // Return Message to Namespace
    socket.emit('success', 'You are Leaving a Room: ' + data)
  })

  // Disconnect
  socket.on('disconnect', function(data) {
    // Check if Username is Set
    // If it's Set Then Remove it from Users
    if (socket.username !== undefined) {
      socketUsers.splice(socketUsers.indexOf(socket), 1)
    }

    socketConns.splice(socketConns.indexOf(socket), 1)
    console.log('Connected: %s sockets connected', socketConns.length)
  })
})
// -------------------------------------------------

// -------------------------------------------------
// Servers
server.listen(port, function() {
  console.log('Server Started at Port ' + port)
})
// -------------------------------------------------
