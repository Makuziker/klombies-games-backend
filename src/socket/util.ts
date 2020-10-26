import { ICallback } from './types'

export const notify = (callback: ICallback, request = {}, error?: string) => {
  return callback({ request, error });
}
