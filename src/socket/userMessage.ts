import uniqueString from 'unique-string';

import { SOCKET_IO } from '../constants';
import { ISocketFn, IMessageProps, ICallback } from './types';
import { notify } from './util';

export const userMessage: ISocketFn = (socket, io) => {
  socket.on(SOCKET_IO.MESSAGE, (request: IMessageProps, callback: ICallback = () => { }) => {
    const { owner, text } = request;

    if (!owner.id || !owner.name || !owner.room || !text) {
      return notify(callback, request, 'Invalid request data.');
    }

    socket.emit(SOCKET_IO.ON_MESSAGE, { // clients are not receiving each others' messages
      id: uniqueString(),
      owner,
      text
    });

    return notify(callback, request);
  });
}