import { SOCKET_IO } from '../constants';
import { addUser } from '../models/user';
import { ISocketFn, ICallback, IJoinRoomProps } from './types';

export const joinRoom: ISocketFn = socket => {
  socket.on(
    SOCKET_IO.JOIN_ROOM,
    (request: IJoinRoomProps, callback: ICallback<IJoinRoomProps> = () => {}) => {
      const notify = (error?: string) => callback({ request, error });
      const { name, room } = request;
      const { error, user } = addUser({ id: socket.id, name, room })

      if (error) return notify(error);
      if (!user) return notify('Failed to add user');

      socket.emit(SOCKET_IO.ON_CURRENT_USER_JOIN_ROOM, { user });

      // socket.emit(SOCKET_IO.MESSAGE, {
      //   user: ADMIN,
      //   text: `Hello ${user.name}. Welcome to the room ${user.room}.`
      // })

      // socket.broadcast.to(user.room).emit(SOCKET_IO.MESSAGE, {
      //   user: ADMIN,
      //   text: `${user.name} has joined.`
      // })

      // socket.join(user.room)
      // io.to(user.room).emit(SOCKET_IO.ROOM_DATA, { room: user.room, users: getUsersInRoom(user.room) })

      // notify();
    }
  );
}