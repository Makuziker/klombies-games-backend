import { IUser } from '../types';

const users: IUser[] = [];

export const addUser = ({ id, name, room }: { id: string, name: string, room: string }) => {
  const trimmedName = name.trim().toLowerCase();
  const trimmedRoom = room.trim().toLowerCase();

  const existingUser = users.find(u => u.name === trimmedName && u.room === trimmedRoom);
  if (existingUser) {
    return { error: 'Username is taken' };
  }

  const user = { id, name: trimmedName, room: trimmedRoom, readyToStart: false };
  users.push(user);
  return { user };
}

export const removeUser = (id: string) => {
  const idx = users.findIndex(user => user.id === id);
  if (idx !== -1) {
    return users.splice(idx, 1)[0];
  }
}

export const getUser = (id: string) => users.find(user => user.id === id);

export const getUsersInRoom = (room: string) => users.filter(user => user.room === room);

export const userReadyToStart = (id: string) => {
  const user = getUser(id);
  if (!user) return;
  user.readyToStart = true;
  return user;
}

export const allUsersInRoomReady = (room: string) => {
  const usersInRoom = getUsersInRoom(room);
  if (usersInRoom.length === 0) return false;
  return usersInRoom.every(user => user.readyToStart);
}

export const resetReadyToStartInRoom = (room: string) => {
  const usersInRoom = getUsersInRoom(room);
  if (usersInRoom.length === 0) return;
  usersInRoom.forEach(user => user.readyToStart = false);
}
