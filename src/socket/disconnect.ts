import { ADMIN, SOCKET_IO } from '../constants';
import { getUsersInRoom, removeUser } from '../models/user';
import { ISocketFn } from './types';

export const disconnect: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.DISCONNECT,
    () => {
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
    }
  );
}