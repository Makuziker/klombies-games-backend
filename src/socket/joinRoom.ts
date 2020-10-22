import { SOCKET_IO } from '../constants';
import { addUser, getUsersInRoom } from '../models/user';
import { ISocketFn, ICallback, IJoinRoomProps } from './types';

export const joinRoom: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.JOIN_ROOM,
    (request: IJoinRoomProps, callback: ICallback<IJoinRoomProps> = () => { }) => {
      const notify = (error?: string) => callback({ request, error });
      const { name, room } = request;
      const { error, user } = addUser({ id: socket.id, name, room });

      if (error) return notify(error);
      if (!user) return notify('Failed to add user');

      socket.emit(SOCKET_IO.ON_CURRENT_USER_JOIN_ROOM, { user });

      const usersInRoom = getUsersInRoom(user.room);

      io.in(user.room).emit(SOCKET_IO.ON_USERS_IN_ROOM, {
        usersInRoom
      });

      return notify();
    }
  );
}