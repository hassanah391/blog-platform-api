import express from 'express';
import dbClient from '../utils/db.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ObjectId } from 'mongodb';


export default class UsersController {
  static async createUser(request, response) {
    const { email, password, firstName, lastName, phoneNumber} = request.body;

    if (!email) return response.status(400).send({ error: 'Missing email' });

    if (!password) { return response.status(400).send({ error: 'Missing password' }); }

    await dbClient.init();
    const usersCollection = await dbClient.getCollection('users');

    const emailExists = await usersCollection.findOne({ email });

    if (emailExists) { return response.status(400).send({ error: 'Already exist' }); }

    const hashedPassword = await argon2.hash(password);

    let result;
    try {
      result = await usersCollection.insertOne({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber
      });
    } catch (err) {
      return response.status(500).send({ error: 'Error creating user.' });
    }
    const user = {
      id: result.insertedId,
      email,
    };

    return response.status(201).send(user);
  }

  static async connectUser(request, response) {
    const { email, password } = request.body;
    if (!email) { return response.status(400).send({ error: 'Missing email' }) }
    if (!password) { return response.status(400).send({ error: 'Missing password' }); }

    await dbClient.init();
    const usersCollection = await dbClient.getCollection('users');
    const user = await usersCollection.findOne({ email });
    if (!user) { return response.status(401).send({ error: 'User doesn\'t exist' })}

    const hashedPasswordFromDB = user.password;
    const isMatch = await argon2.verify(hashedPasswordFromDB, password);
    if (!isMatch) { return response.status(401).send({ error: 'Wrong Password' }) }

    const payload = {
      userId: user._id,
      email: user.email,
    };
    // Generate access token
    const accessToken = jwt.sign(payload, config.secretKey, { expiresIn: '1h' });
    // Generate refresh token (longer expiry)
    const refreshToken = jwt.sign(payload, config.secretKey, { expiresIn: '7d' });
    // Store refresh token in DB
    await usersCollection.updateOne({ _id: user._id }, { $set: { refreshToken } });
    response.send({ accessToken, refreshToken });
  }

  // Refresh token endpoint
  static async refreshToken(request, response) {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      return response.status(400).send({ error: 'Missing refresh token' });
    }
    await dbClient.init();
    const usersCollection = await dbClient.getCollection('users');
    let payload;
    try {
      payload = jwt.verify(refreshToken, config.secretKey);
    } catch (err) {
      return response.status(401).send({ error: 'Invalid or expired refresh token' });
    }
    // Find user with this refresh token (convert userId to ObjectId)
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId), refreshToken });
    if (!user) {
      return response.status(401).send({ error: 'Invalid refresh token' });
    }
    // Issue new access token (and optionally rotate refresh token)
    const newAccessToken = jwt.sign({ userId: user._id, email: user.email }, config.secretKey, { expiresIn: '1h' });
    // Optionally rotate refresh token for extra security
    const newRefreshToken = jwt.sign({ userId: user._id, email: user.email }, config.secretKey, { expiresIn: '7d' });
    await usersCollection.updateOne({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });
    response.send({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  }

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
