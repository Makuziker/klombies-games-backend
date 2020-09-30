# Klombies Games - Backend

## DEVELOP
- `npm install`
- `tsc -w`
- `npm start` OR start debugger

## HIGH LEVEL OVERVIEW:
- `server.ts` starts an HTTP server and chauffeurs Socket.IO events between connected clients and game instances.
- `user.ts` holds users in memory for the server to lookup.
- `five-crowns.ts` is a factory for creating a game instance. Contains game state and logic internally.
- `game-sessions.ts` holds game instances in memory for the server to lookup.

## NOTES:
- referenceError occured when running program with Node v12.18.4. Rolled back to Node v10.13.0 and it works there.
- `.vscode/launch.json` `runtimeExecutable` points to my local nvm path. To fix.
- games and users are currently held in memory. Store data in firebase during finalization stages.
- error handling not yet consistent across backend.
- may need to adjust game state object sent to client for ease of use.