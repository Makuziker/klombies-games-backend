import uniqueString from 'unique-string';

import { ADMIN, SOCKET_IO } from '../constants';
import { getSession } from '../models/game-sessions';
import { getUser, getUsersInRoom } from '../models/user';
import { ICallback, ILayDownCardsProps, ISocketFn } from './types';
import { notify } from './util';

export const layDownCards: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.LAY_DOWN_CARDS,
    (request: ILayDownCardsProps, callback: ICallback = () => { }) => {
      const user = getUser(socket.id);
      if (!user) return notify(callback, request, 'Could not find user.');

      const game = getSession(user.room);
      if (!game) return notify(callback, request, `Could not find game for room ${user.room}`);

      const error = game.layDownCards(socket.id, request.groups, request.discard);
      if (error) {
        if (Array.isArray(error)) {
          error.forEach(e => {
            socket.emit(SOCKET_IO.ON_MESSAGE, {
              id: uniqueString(),
              owner: ADMIN,
              text: e.errorMessage
            });
          });
        } else {
          socket.emit(SOCKET_IO.ON_MESSAGE, {
            id: uniqueString(),
            owner: ADMIN,
            text: error
          });
        }
        return notify(callback, request, error);
      }

      const usersInRoom = getUsersInRoom(user.room);
      usersInRoom.forEach(u => {
        const state = game.getPublicStateAndPrivatePlayer(u.id);
        io.to(u.id).emit(SOCKET_IO.ON_UPDATE_GAME_STATE, state);
      });

      return notify(callback);
    }
  );
}