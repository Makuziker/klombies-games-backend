import { createServer } from 'http';
import express from 'express';
import helmet from 'helmet';

import router from './router';
import initializeSockets from './socket';
import { PORT } from './constants';

const app = express();
const server = createServer(app);

app.use(helmet());
app.use(router);

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

initializeSockets(server);
