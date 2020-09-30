import { FiveCrownsInterface } from './five-crowns'

const gameSessions: { [key: string]: FiveCrownsInterface } = {}

export const getSession = (roomName: string) => gameSessions[roomName] || null

export const addSession = (roomName: string, game: FiveCrownsInterface) => {
  // For now, just replace old sessions with new ones
  if (gameSessions[roomName]) {
    removeSession(roomName)
  }
  gameSessions[roomName] = game
  return gameSessions[roomName]
}

export const removeSession = (roomName: string) => {
  delete gameSessions[roomName]
}