import http from 'http'

import express from 'express'
import socketIO from 'socket.io'
// import helmet from 'helmet'
import cors from 'cors'

import router from './router'
import { addUser, removeUser, getUser, getUsersInRoom, userReadyToStart, allUsersInRoomReady } from './models/user'
import { fiveCrowns } from './models/five-crowns'
import { addSession, getSession } from './models/game-sessions'
import { SOCKET_IO, PORT, ADMIN } from './constants'

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

// app.use(helmet()) // need to configure?

app.use(cors())
app.use(router)

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`)
})

/*** SOCKET.IO ***/

io.on('connection', socket => {
  socket.on(SOCKET_IO.JOIN_ROOM, ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room })

    if (error) return callback(error)
    if (!user) return callback('Failed to add user')

    socket.emit(SOCKET_IO.MESSAGE, {
      user: ADMIN,
      text: `Hello ${user.name}. Welcome to the room ${user.room}.`
    })

    socket.broadcast.to(user.room).emit(SOCKET_IO.MESSAGE, {
      user: ADMIN,
      text: `${user.name} has joined.`
    })

    socket.join(user.room)
    io.to(user.room).emit(SOCKET_IO.ROOM_DATA, { room: user.room, users: getUsersInRoom(user.room) })

    callback()
  })

  socket.on(SOCKET_IO.USER_MESSAGE, (message, callback) => {
    const user = getUser(socket.id)
    if (!user) return callback('Could not find user.')

    io.to(user.room).emit(SOCKET_IO.MESSAGE, {
      user: user.name,
      text: message
    })

    callback()
  })

  socket.on(SOCKET_IO.READY_TO_START, (callback) => {
    const user = userReadyToStart(socket.id)
    if (!user) {
      return callback('No user found. Cannot mark ready to start.')
    }

    io.to(user.room).emit(SOCKET_IO.MESSAGE, {
      user: ADMIN,
      text: `${user.name} is ready to start`
    })

    // wait until everyone is marked ready
    if (allUsersInRoomReady(user.room)) {
      console.log(`all users in ${user.room} are ready`)
      const usersInRoom = getUsersInRoom(user.room)
      const newGame = fiveCrowns(usersInRoom.map(user => user.id))
      const game = addSession(user.room, newGame)

      // with 'start game' send each player the game state with only their private hand
      usersInRoom.forEach(u => {
        const state = game.getPublicStateAndPrivatePlayer(u.id)
        if (!state) throw new Error(`Player ${u.id} not found in new game state.`)
        io.to(u.id).emit(SOCKET_IO.START_GAME, { state })
      })
    }

    callback()
  })

  socket.on(SOCKET_IO.DRAW_FROM_DECK, (callback) => {
    const user = getUser(socket.id)
    if (!user) return callback('Could not find user.')

    const game = getSession(user.room)
    if (!game) return callback(`Could not find game for room ${user.room}.`)

    const error = game.drawFromDeck(socket.id)
    if (error) {
      console.log(error, socket.id)
      return callback(error)
    }

    const player = game.getPrivatePlayer(socket.id)
    if (!player) return callback('Could not find player.')

    socket.emit(SOCKET_IO.UPDATE_PLAYER_HAND, player.hand)

    return callback()
  })

  socket.on(SOCKET_IO.DRAW_FROM_DISCARD, (callback) => {
    const user = getUser(socket.id)
    if (!user) return callback('Could not find user.')

    const game = getSession(user.room)
    if (!game) return callback(`Could not find game for room ${user.room}`)

    const error = game.drawFromDiscard(socket.id)
    if (error) {
      console.log(error, socket.id)
      return callback(error)
    }

    const player = game.getPrivatePlayer(socket.id)
    if (!player) return callback('Could not find player')

    socket.emit(SOCKET_IO.UPDATE_PLAYER_HAND, player.hand)

    callback()
  })

  socket.on(SOCKET_IO.DISCARD_FROM_HAND, (card, callback) => {
    if (!card) return callback('No card provided to send to discard.')

    const user = getUser(socket.id)
    if (!user) return callback('Could not find user.')

    const game = getSession(user.room)
    if (!game) return callback(`Could not find game for room ${user.room}`)

    const error = game.discardFromHand(socket.id, card)
    if (error) {
      console.log(error, socket.id)
      return callback(error)
    }

    const player = game.getPrivatePlayer(socket.id)
    if (!player) return callback('Could not find player.')

    socket.emit(SOCKET_IO.UPDATE_PLAYER_HAND, player.hand)

    callback()
  })

  socket.on(SOCKET_IO.GO_OUT, (callback) => {

  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit(SOCKET_IO.MESSAGE, {
        user: ADMIN,
        text: `${user.name} has left.`
      })
      io.to(user.room).emit(SOCKET_IO.ROOM_DATA, {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})
