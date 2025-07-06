// server.js - Express server setup for the blog platform API
// Sets up middleware and starts the server
import express from 'express';
import { config } from './config.js';
import routes from './routes/index.js'

const port = config.serverPort;
const app = express();

// Parse JSON request bodies
app.use(express.json());
// Register all API routes
app.use('/', routes); // All routing is handled here

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
