import http from 'http'
import express from 'express'
// import helmet from 'helmet'
import cors from 'cors'

import router from './router'
import { PORT } from './constants';
import initializeSockets from './socket';

const app = express();
const server = http.createServer(app);

// app.use(helmet()) // need to configure?

app.use(cors());
app.use(router);

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`)
});

initializeSockets(server);
