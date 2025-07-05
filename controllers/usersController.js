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

    static async deleteMe(request, response) {
      try {
        const user = await request.user;

        if (!user) return response.status(401).send({ error: 'Unauthorized' });

        await dbClient.init();
        const usersCollection = await dbClient.getCollection('users');
        const query = { _id: new ObjectId(user._id) };
        const result = await usersCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          return response.status(200).send(`Successfully deleted account with email: ${user.email}`);
        } else {
          return response.status(404).send({ error: `No user found with email: ${user.email}` });
        }
      } catch (err) {
        return response.status(500).send({ error: 'Internal server error' });
      }
    }

    static async addProfileInfo(request, response) {
      try {
        const user = await request.user;
        const { bio } = request.body;
        
        if (!bio || typeof bio !== 'string' || bio.trim().length === 0) {
          return response.status(400).json({ error: 'Bio is required and must be a non-empty string' });
        }

        if (bio.length > 500) {
          return response.status(400).json({ error: 'Bio must be less than 500 characters' });
        }

        await dbClient.init();
        const usersCollection = await dbClient.getCollection('users');
        const result = await usersCollection.updateOne(
          { email: user.email},
          { $set: { bio: bio.trim() } }
        );
        
        if (result.matchedCount === 0) {
          return response.status(404).json({ error: 'User not found' });
        }

        return response.status(200).json({ 
          message: 'Bio updated successfully',
          bio: bio.trim()
        });
      } catch (err) {
        console.error('Error in addProfileInfo:', err);
        return response.status(500).json({ error: 'Internal server error' });
      }
    }
    static async getUserPublicInfo(request, response) {
      try {
        const { id: userId } = request.params;
        
        if (!userId) {
          return response.status(400).json({ error: "User ID is required" });
        }
        
        if (!ObjectId.isValid(userId)) {
          return response.status(400).json({ error: "Invalid ID" });
        }
        
        await dbClient.init();
        const usersCollection = await dbClient.getCollection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
          return response.status(404).json({ error: 'User not found' });
        }
        const posts = await dbClient.getCollection('posts');
        const postCount = await posts.countDocuments({ author: user._id });

        
        const payload = {
          userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          postCount
        };

        // Add bio to payload if it exists
        if (user.bio) {
          payload.bio = user.bio;
        }

        return response.status(200).json(payload);
      } catch (err) {
        console.error('Error in getUserPublicInfo:', err);
        return response.status(500).json({ error: 'Internal server error' });
      }
    }
}