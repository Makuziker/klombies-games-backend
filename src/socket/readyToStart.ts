import { ADMIN, SOCKET_IO } from '../constants';
import { fiveCrowns } from '../models/five-crowns';
import { addSession } from '../models/game-sessions';
import { allUsersInRoomReady, getUsersInRoom, userReadyToStart } from '../models/user';
import { ISocketFn } from './types';

export const readyToStart: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.READY_TO_START,
    (callback) => {
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
    }
  );
}