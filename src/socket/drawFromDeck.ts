import uniqueString from 'unique-string';
import { ADMIN, SOCKET_IO } from '../constants';
import { getSession } from '../models/game-sessions';
import { getUser, getUsersInRoom } from '../models/user';
import { ICallback, ISocketFn } from './types';
import { notify } from './util';

export const drawFromDeck: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.DRAW_FROM_DECK, (callback: ICallback = () => {}) => {
    const user = getUser(socket.id);
    if (!user) return notify(callback, {}, 'Could not find user.');

    const game = getSession(user.room);
    if (!game) return notify(callback, {}, `Could not find game for room ${user.room}.`);

    const error = game.drawFromDeck(socket.id);
    if (error) {
      console.log(error, socket.id);
      return notify(callback, {}, error);
    }

    const usersInRoom = getUsersInRoom(user.room);
    usersInRoom.forEach(u => {
      io.to(u.id).emit(SOCKET_IO.ON_MESSAGE, {
        id: uniqueString(),
        owner: ADMIN,
        text: `${user.name} drew from Deck.`,
      });
    });

    const state = game.getPublicStateAndPrivatePlayer(socket.id);
    if (!state) return notify(callback, {}, `Could not find player ${socket.id}`);
    socket.emit(SOCKET_IO.ON_UPDATE_GAME_STATE, state);

    return notify(callback);
  });
}