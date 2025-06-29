import express from 'express';
import { config } from './config.js';

const port = config.serverPort;
const app = express();

app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;

