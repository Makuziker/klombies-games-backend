import { SOCKET_IO } from '../constants';
import { fiveCrowns } from '../models/five-crowns';
import { addSession } from '../models/game-sessions';
import { allUsersInRoomReady, getUsersInRoom, resetReadyToStartInRoom, userReadyToStart } from '../models/user';
import { ICallback, ISocketFn } from './types';
import { notify } from './util';

export const readyToStart: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.READY_TO_START, (callback: ICallback = () => { }) => {
    const user = userReadyToStart(socket.id);
    if (!user) return notify(callback, {}, 'No user found. Cannot mark ready to start.');

    const usersInRoom = getUsersInRoom(user.room);
    usersInRoom.forEach(u => io.to(u.id).emit(SOCKET_IO.ON_USERS_IN_ROOM, { usersInRoom }));

    if (allUsersInRoomReady(user.room)) {
      const newGame = fiveCrowns(usersInRoom.map(u => u.id));
      const game = addSession(user.room, newGame);

      usersInRoom.forEach(u => {
        const state = game.getPublicStateAndPrivatePlayer(u.id);
        if (!state) throw new Error(`Player ${u.id} not found in new game state.`);
        io.to(u.id).emit(SOCKET_IO.ON_START_GAME, state);
      });
      resetReadyToStartInRoom(user.room);
      usersInRoom.forEach(u => io.to(u.id).emit(SOCKET_IO.ON_USERS_IN_ROOM, { usersInRoom }));
    }

    return notify(callback);
  });
}