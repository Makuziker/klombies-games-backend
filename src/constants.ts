export const PORT = process.env.PORT || 8080

export const ADMIN = 'admin'

export const SOCKET_IO = {
  DISCONNECT: 'disconnect',
  DRAW_FROM_DECK: 'draw from deck',
  DRAW_FROM_DISCARD: 'draw from discard',
  DISCARD_FROM_HAND: 'discard from hand',
  GO_OUT: 'go out',
  JOIN_ROOM: 'join',
  MESSAGE: 'message',
  ON_CURRENT_USER_JOIN_ROOM: 'current_user_join_room',
  READY_TO_START: 'ready to start',
  ROOM_DATA: 'roomData',
  START_GAME: 'start game',
  UPDATE_PLAYER_HAND: 'update player hand',
  USER_MESSAGE: 'sendMessage',
}