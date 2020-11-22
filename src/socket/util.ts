import { IInvalidGroupMessage } from '../models/five-crowns/types';
import { ICallback } from './types'

export const notify = (callback: ICallback, request = {}, error?: string | IInvalidGroupMessage[]) => {
  return callback({ request, error });
}
