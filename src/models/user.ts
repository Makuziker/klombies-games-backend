interface User {
  id: string,
  name: string,
  room: string,
  readyToStart: boolean
}

const users: User[] = []

export const addUser = ({ id, name, room }: { id: string, name: string, room: string }) => {
  name = name.trim().toLowerCase()
  room = room.trim().toLowerCase()

  const existingUser = users.find(user => user.name === name && user.room === room)
  if (existingUser) {
    return { error: 'Username is taken' }
  }

  const user = { id, name, room, readyToStart: false }
  users.push(user)
  return { user }
}

export const removeUser = (id: string) => {
  const idx = users.findIndex(user => user.id === id)
  if (idx !== -1) {
    return users.splice(idx, 1)[0]
  }
}

export const getUser = (id: string) => users.find(user => user.id === id)

export const getUsersInRoom = (room: string) => users.filter(user => user.room === room)

export const userReadyToStart = (id: string) => {
  const user = getUser(id)
  if (!user) return
  user.readyToStart = true
  return user
}

export const allUsersInRoomReady = (room: string) => {
  const usersInRoom = getUsersInRoom(room)
  if (usersInRoom.length === 0) return false
  return usersInRoom.every(user => user.readyToStart)
}

export const resetReadyToStartInRoom = (room: string) => {
  const usersInRoom = getUsersInRoom(room)
  if (usersInRoom.length === 0) return
  usersInRoom.forEach(user => user.readyToStart = false)
}
