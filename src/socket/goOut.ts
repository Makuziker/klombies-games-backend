import { SOCKET_IO } from '../constants';
import { getSession } from '../models/game-sessions';
import { getUser, getUsersInRoom } from '../models/user';
import { ICallback, IGoOutProps, ISocketFn } from './types';
import { notify } from './util';

export const goOut: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.GO_OUT,
    (request: IGoOutProps, callback: ICallback = () => { }) => {
      const user = getUser(socket.id);
      if (!user) return notify(callback, request, 'Could not find user.');

      const game = getSession(user.room);
      if (!game) return notify(callback, request, `Could not find game for room ${user.room}`);

      const error = game.goOut(socket.id, request.groups, request.discard);
      if (error) {
        console.log(error, socket.id);
        return notify(callback, request, error);
      }

      const player = game.getPrivatePlayer(socket.id);
      if (!player) return notify(callback, request, 'Could not find player');

      const usersInRoom = getUsersInRoom(user.room);
      usersInRoom.forEach(u => {
        const state = game.getPublicStateAndPrivatePlayer(u.id);
        io.to(u.id).emit(SOCKET_IO.ON_UPDATE_GAME_STATE, state);
      });

      return notify(callback);
    }
  );
}