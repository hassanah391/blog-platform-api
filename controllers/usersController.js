import express from 'express';
import dbClient from '../utils/db.js';
import { config } from '../config.js';
import { ObjectId } from 'mongodb';

export default class UsersController {
    /**
   *
   * Should retrieve the user base on the token used
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a
   * status code 401
   * Otherwise, return the user object (email and id only)
   */
    static async getMe(request, response) {

      const user = await request.user;
  
      if (!user) return response.status(401).send({ error: 'Unauthorized' });
  
      const processedUser = { id: user._id, ...user };
  
      return response.status(200).send(processedUser);
    }
}