import { IUser } from "./types";

export const PORT = process.env.PORT || 4000;

export const CLIENT_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://klombies-games.web.app'
  : 'http://localhost:3000';

export const ADMIN: IUser = {
  name: 'Admin',
  id: '000',
  room: '',
  readyToStart: false,
};

export const SOCKET_IO = {
  JOIN_ROOM: 'JOIN_ROOM',
  MESSAGE: 'MESSAGE',
  READY_TO_START: 'READY_TO_START',
  START_GAME: 'START_GAME',
  DRAW_FROM_DECK: 'DRAW_FROM_DECK',
  DRAW_FROM_DISCARD: 'DRAW_FROM_DISCARD',
  DISCARD_FROM_HAND: 'DISCARD_FROM_HAND',
  GO_OUT: 'GO_OUT',
  LAY_DOWN_CARDS: 'LAY_DOWN_CARDS',
  DISCONNECT: 'DISCONNECT',
  ON_CURRENT_USER_JOIN_ROOM: 'ON_CURRENT_USER_JOIN_ROOM',
  ON_USERS_IN_ROOM: 'ON_USERS_IN_ROOM',
  ON_MESSAGE: 'ON_MESSAGE',
  ON_START_GAME: 'ON_START_GAME',
  ON_UPDATE_PLAYER_HAND: 'ON_UPDATE_PLAYER_HAND',
  ON_UPDATE_GAME_STATE: 'ON_UPDATE_GAME_STATE',
};
