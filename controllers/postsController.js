import express from 'express';
import dbClient from '../utils/db.js';
import { config } from '../config.js';
import { ObjectId } from 'mongodb';

export default class PostsController {
  static async getAllPostsFromDB(request, response) {
    try {
      await dbClient.init();
      const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = request.query;
      const skip = (page - 1) * limit;
      
      const postsCollection = await dbClient.getCollection('posts');
      const posts = await postsCollection
        .find()
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
        
      const total = await postsCollection.countDocuments();
      
      return response.status(200).json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPost(request, response) {
    try {
      const { id } = request.params;

      if (!id) {
        return response.status(400).json({ error: "Post ID is required" });
      }

      if (!ObjectId.isValid(id)) {
        return response.status(400).json({ error: "Invalid ID" });
      }

      await dbClient.init();
      const postsCollection = await dbClient.getCollection('posts');
      const post = await postsCollection.findOne({_id: new ObjectId(id) });

      if (!post) { return response.status(404).send({ error: "Post ID not found" })}

      response.status(200).send({post});
    } catch (error) {
      console.error('Error fetching a post with a passed id:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createPost(request, response) {
    try {
      const user = request.user;
      const { title, body, tags, coverImageUrl} = request.body;

      if (!title || !body) { return response.status(400).json({'error': 'title and body needed'}) }

      const post = {
        title,
        body,
        author: new ObjectId(user.userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (tags) { post.tags = Array.isArray(tags) ? tags : [tags] }
      if (coverImageUrl) { post.coverImageUrl = request.body.coverImageUrl }
      await dbClient.init();
      const postsCollection = await dbClient.getCollection('posts');
      const result = await postsCollection.insertOne(post);
      if (!result.acknowledged) { return response.status(500).json({error: "Post wasn't created"}) }

      return response.status(201).json({
        message: 'Post created successfully',
      postId: result.insertedId
      });

    } catch (error){
    return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updatePost(request, response) {
    try {
      const user = request.user;
      const { id } = request.params;
      const { title, body, tags, coverImageUrl } = request.body;

      // Validate post ID
      if (!id) {
        return response.status(400).json({ error: "Post ID is required" });
      }
      if (!ObjectId.isValid(id)) {
        return response.status(400).json({ error: "Invalid Post ID" });
      }

      // Build update object
      const updateFields = {};
      if (title) updateFields.title = title;
      if (body) updateFields.body = body;
      if (tags) updateFields.tags = Array.isArray(tags) ? tags : [tags];
      if (coverImageUrl) updateFields.coverImageUrl = coverImageUrl;
      updateFields.updatedAt = new Date().toISOString();

      if (Object.keys(updateFields).length === 1 && updateFields.updatedAt) {
        return response.status(400).json({ error: "No fields to update" });
      }

      await dbClient.init();
      const postsCollection = await dbClient.getCollection('posts');

      // Ensure only the author can update their post
      const filter = { _id: new ObjectId(id), author: new ObjectId(user.userId) };

      const result = await postsCollection.updateOne(filter, { $set: updateFields });

      if (result.matchedCount === 0) {
        return response.status(404).json({ error: "Post not found or you are not the author" });
      }
      if (result.modifiedCount === 0) {
        return response.status(200).json({ message: "No changes made to the post" });
      }

      return response.status(200).json({ message: "Post updated successfully" });
    } catch (error) {
      console.error('Error updating post:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deletePost(request, response) {
    try {
      const user = request.user;
      const {id: postId} = request.params;
      if (!postId) { return response.status(400).json({error: "post ID is required"})}
      if (!ObjectId.isValid(postId)) {
        return response.status(400).json({ error: "Invalid Post ID" });
      }
      await dbClient.init();
      const postsCollection = await dbClient.getCollection('posts');
      const filter = { _id: new ObjectId(postId), author: new ObjectId(user.userId) };
      const result = await postsCollection.deleteOne(filter);
      if (!result.acknowledged) { return response.status(500).json({error: "Failed to delete post"}) }
      if (result.deletedCount === 0) { return response.status(404).json({error: "Post not found or you are not the author"}) }

      return response.status(200).send("Post deleted successfully");
    } catch (error) {
      console.error('Error deleting post:', error);
      return response.status(500).json({error: "Internal server error"});
    }
  }
}
