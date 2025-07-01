import express from 'express';
import dbClient from '../utils/db.js';
import argon2 from 'argon2';



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

  // /**
  //  *
  //  * Should retrieve the user base on the token used
  //  *
  //  * Retrieve the user based on the token:
  //  * If not found, return an error Unauthorized with a
  //  * status code 401
  //  * Otherwise, return the user object (email and id only)
  //  */
  // static async getMe(request, response) {
  //   const { userId } = await userUtils.getUserIdAndKey(request);

  //   const user = await userUtils.getUser({
  //     _id: ObjectId(userId),
  //   });

  //   if (!user) return response.status(401).send({ error: 'Unauthorized' });

  //   const processedUser = { id: user._id, ...user };
  //   delete processedUser._id;
  //   delete processedUser.password;

  //   return response.status(200).send(processedUser);
  // }
}
