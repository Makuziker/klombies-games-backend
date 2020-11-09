import { Socket, Server } from 'socket.io'
import { ICard } from '../models/five-crowns/types';
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

export interface IDiscardFromHandProps {
  card: ICard;
}

export interface IGoOutProps {
  groups: ICard[][];
  discard: ICard;
}