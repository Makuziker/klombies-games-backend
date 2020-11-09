import { SOCKET_IO } from '../constants';
import { getSession } from '../models/game-sessions';
import { getUser, getUsersInRoom } from '../models/user';
import { ICallback, ISocketFn } from './types';
import { notify } from './util';

export const drawFromDiscard: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.DRAW_FROM_DISCARD, (callback: ICallback = () => { }) => {
    const user = getUser(socket.id);
    if (!user) return notify(callback, {}, 'Could not find user.');

    const game = getSession(user.room);
    if (!game) return notify(callback, {}, `Could not find game for room ${user.room}`);

    const error = game.drawFromDiscard(socket.id);
    if (error) {
      console.log(error, socket.id);
      return notify(callback, {}, error);
    }

    const player = game.getPrivatePlayer(socket.id);
    if (!player) return notify(callback, {}, 'Could not find player');

    // socket.emit(SOCKET_IO.ON_UPDATE_PLAYER_HAND, player.hand);

    // const usersInRoom = getUsersInRoom(user.room);
    // usersInRoom.forEach(u => {
    //   const state = game.getPublicState();
    //   io.to(u.id).emit(SOCKET_IO.ON_UPDATE_GAME_STATE, state);
    // });
    const state = game.getPublicStateAndPrivatePlayer(socket.id);
    if (!state) return notify(callback, {}, `Could not find player ${socket.id}`);
    socket.emit(SOCKET_IO.ON_UPDATE_GAME_STATE, state);

    // todo broadcast public state to other players and public+private state for current player

    return notify(callback);
  });
}