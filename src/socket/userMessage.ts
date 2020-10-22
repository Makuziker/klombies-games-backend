import uniqueString from 'unique-string'

import { SOCKET_IO } from '../constants';
import { getUser } from '../models/user';
import { ISocketFn } from './types';

export const userMessage: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.MESSAGE, (message, callback) => {
    const user = getUser(socket.id)
    if (!user) return callback('Could not find user.')

    io.to(user.room).emit(SOCKET_IO.ON_MESSAGE, {
      id: uniqueString(),
      user: user.name,
      text: message
    });

    callback()
  });
}