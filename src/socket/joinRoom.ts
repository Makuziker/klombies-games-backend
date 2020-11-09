import { SOCKET_IO } from '../constants';
import { addUser, getUsersInRoom } from '../models/user';
import { ISocketFn, ICallback, IJoinRoomProps } from './types';
import { notify } from './util';

export const joinRoom: ISocketFn = (socket, io) => {
  socket.on(
    SOCKET_IO.JOIN_ROOM,
    (request: IJoinRoomProps, callback: ICallback = () => { }) => {
      const { name, room } = request;
      const { error, user } = addUser({ id: socket.id, name, room });

      if (error) return notify(callback, request, error);
      if (!user) return notify(callback, request, 'Failed to add user');

      socket.emit(SOCKET_IO.ON_CURRENT_USER_JOIN_ROOM, { user }); // redundant perhaps

      const usersInRoom = getUsersInRoom(user.room);

      usersInRoom.forEach(u => io.to(u.id).emit(SOCKET_IO.ON_USERS_IN_ROOM, { usersInRoom }));

      return notify(callback, request);
    }
  );
}