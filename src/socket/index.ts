import socketIO from 'socket.io';
import { Server } from 'http'

import { joinRoom } from './joinRoom';
import { userMessage } from './userMessage';
import { readyToStart } from './readyToStart';
import { drawFromDeck } from './drawFromDeck';
import { drawFromDiscard } from './drawFromDiscard';
import { discardFromHand } from './discardFromHand';
import { goOut } from './goOut';
import { layDownCards } from './layDownCards';
import { disconnect } from './disconnect';

import { ISocketFn } from './types';

let initialized = false;

export default function initializeSockets(server: Server) {
  if (initialized) {
    return;
  }

  const io = socketIO(server);

  io.on('connection', socket => {
    const listeners: ISocketFn[] = [
      joinRoom,
      userMessage,
      readyToStart,
      drawFromDeck,
      drawFromDiscard,
      discardFromHand,
      goOut,
      layDownCards,
      disconnect
    ];
    listeners.forEach(cb => cb(socket, io));
  });
}