# Klombies Games - Backend

## DEVELOP

- `npm install`
- `npm start` OR start debugger

## HIGH LEVEL OVERVIEW

- `index.ts` starts an express server and initializes socketIO.
- `socket/` contains all socketIO events and chauffeurs data between connected clients and game instances.
- `user.ts` holds users in memory for the server to lookup.
- `game-sessions.ts` holds game instances in memory for the server to lookup.
- `five-crowns/` is a factory for creating a game instance. Contains game state and logic internally.

## NOTES

- referenceError occured when running program with Node v12.18.4. App is confirmed functional on v10.13.0 and v8.12.0.
- `.vscode/launch.json` `runtimeExecutable` points to my local nvm path. To fix.
- games and users are currently held in memory. Store data in firebase during finalization stages.
