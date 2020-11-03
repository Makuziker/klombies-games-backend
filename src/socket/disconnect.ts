import { ADMIN, SOCKET_IO } from '../constants';
import { getUsersInRoom, removeUser } from '../models/user';
import { ISocketFn } from './types';

export const disconnect: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.DISCONNECT, () => {
      const user = removeUser(socket.id);
      if (user) {
        const users = getUsersInRoom(user.room);
        io.to(user.room).emit(SOCKET_IO.ON_USERS_IN_ROOM, { users });
      }
    }
  );
}