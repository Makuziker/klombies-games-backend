import { SOCKET_IO } from '../constants';
import { getSession } from '../models/game-sessions';
import { getUser } from '../models/user';
import { ISocketFn } from './types';

export const discardFromHand: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.DISCARD_FROM_HAND,
    (card, callback) => {
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
    }
  );
}