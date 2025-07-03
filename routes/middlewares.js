import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(request, response, next) {
  const authHeader = request.header('Authorization') || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return response.status(401).json({ error: 'Missing or invalid token' });
  }

  try {
    const decoded = jwt.verify(token, config.secretKey);
    request.user = decoded; // add user data to request
    next(); // move on to the route handler
  } catch (err) {
    return response.status(401).json({ error: 'Invalid or expired token' });
  }
}

