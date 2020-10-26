import { Socket, Server } from 'socket.io'
import { IUser } from '../types';

// Shared types

export type ISocketFn = (socket: Socket, server: Server) => void;
export type ICallback<R extends {} = {}> = (payload: { error?: string; request?: R; }) => void;

// Socket Specific

export interface IJoinRoomProps {
  name: string;
  room: string;
}

export interface IOnCurrentUserJoinRoomProps {
  user: IUser;
}

export interface IMessageProps {
  text: string;
  owner: IUser;
}