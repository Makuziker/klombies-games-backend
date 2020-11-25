import { SOCKET_IO } from '../constants';
import { getSession } from '../models/game-sessions';
import { getUser, getUsersInRoom } from '../models/user';
import { ICallback, IDiscardFromHandProps, ISocketFn } from './types';
import { notify } from './util';

export const discardFromHand: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.DISCARD_FROM_HAND,
    (request: IDiscardFromHandProps, callback: ICallback = () => { }) => {
      if (!request.card) return notify(callback, request, 'No card provided to send to discard.');

      const user = getUser(socket.id);
      if (!user) return notify(callback, request, 'Could not find user.');

      const game = getSession(user.room);
      if (!game) return notify(callback, request, `Could not find game for room ${user.room}`);

      const error = game.discardFromHand(socket.id, request.card);
      if (error) {
        console.log(error, socket.id);
        return notify(callback, request, error);
      }

      const usersInRoom = getUsersInRoom(user.room);
      usersInRoom.forEach(u => {
        const state = game.getPublicStateAndPrivatePlayer(u.id);
        io.to(u.id).emit(SOCKET_IO.ON_UPDATE_GAME_STATE, state);
      });

      return notify(callback);
    },
  );
}