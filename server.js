import express from 'express';
import { config } from './config.js';
import routes from './routes/index.js'

const port = config.serverPort;
const app = express();

app.use(express.json());
app.use('/', routes); // All routing is handled here

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
