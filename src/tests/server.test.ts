import request from 'supertest';
import initApp from '../server'; // Make sure initApp connects to the DB
import mongoose from 'mongoose';
import { Express } from 'express';

let app: Express;

describe('Server initialization', () => {

  beforeAll(async () => {
    process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test'; 
    app = await initApp();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Non-existent routes', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
  });

  test('MONGO_URI not defined', async () => {
    process.env.MONGO_URI = '';
    try {
      await initApp(); 
    } catch (error) {
      console.log('error', error);
      expect(error).toBe('MONGO_URI is not defined in .env file');
    }
  });
});