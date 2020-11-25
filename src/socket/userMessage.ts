import uniqueString from 'unique-string';

import { SOCKET_IO } from '../constants';
import { getUsersInRoom } from '../models/user';
import { ISocketFn, IMessageProps, ICallback } from './types';
import { notify } from './util';

export const userMessage: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.MESSAGE, (request: IMessageProps, callback: ICallback = () => { }) => {
    const { owner, text } = request;

    if (!owner.id || !owner.name || !owner.room || !text) {
      return notify(callback, request, 'Invalid request data.');
    }

    const usersInRoom = getUsersInRoom(owner.room);
    usersInRoom.forEach(u => {
      io.to(u.id).emit(SOCKET_IO.ON_MESSAGE, {
        id: uniqueString(),
        owner,
        text,
      });
    });

    return notify(callback, request);
  });
}