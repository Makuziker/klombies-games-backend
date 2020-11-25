import { Server, Socket } from 'socket.io';
import http from 'http';

import { joinRoom } from './joinRoom';
import { userMessage } from './userMessage';
import { readyToStart } from './readyToStart';
import { drawFromDeck } from './drawFromDeck';
import { drawFromDiscard } from './drawFromDiscard';
import { discardFromHand } from './discardFromHand';
import { goOut } from './goOut';
import { layDownCards } from './layDownCards';
import { disconnect } from './disconnect';
import { CLIENT_ORIGIN } from '../constants';
import { ISocketFn } from './types';

let initialized = false;

export default function initializeSockets(server: http.Server) {
  if (initialized) {
    return;
  }

  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    const listeners: ISocketFn[] = [
      joinRoom,
      userMessage,
      readyToStart,
      drawFromDeck,
      drawFromDiscard,
      discardFromHand,
      goOut,
      layDownCards,
      disconnect,
    ];
    listeners.forEach(cb => cb(socket, io));
  });

  initialized = true;
}