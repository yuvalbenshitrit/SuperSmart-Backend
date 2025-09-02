import { Request, Response } from 'express';
import { getCartMessages, addCartMessage } from '../controllers/chat';
import CartMessage from '../models/cartMessage';
import request from 'supertest';
import express from 'express';
import chatRouter from '../routes/chat';

jest.mock('../models/cartMessage', () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

describe('Chat Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getCartMessages', () => {
    it('should return 400 if cartId is not provided', async () => {
      await getCartMessages(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Cart ID is required' });
    });

    it('should return messages for a cart', async () => {
      const messages = [
        { id: '1', message: 'Hello', sender: 'user', timestamp: new Date() },
        { id: '2', message: 'Hi', sender: 'assistant', timestamp: new Date() },
      ];

      const sortSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockResolvedValue(messages);

      (CartMessage.find as jest.Mock).mockReturnValue({
        sort: sortSpy,
        limit: limitSpy,
      });

      mockRequest.params = { cartId: '123' };

      await getCartMessages(mockRequest as Request, mockResponse as Response);

      expect(CartMessage.find).toHaveBeenCalledWith({ cartId: '123' });
      expect(sortSpy).toHaveBeenCalledWith({ timestamp: -1 });
      expect(limitSpy).toHaveBeenCalledWith(30);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should filter messages with before parameter', async () => {
      const messages = [{ id: '1', message: 'Test', sender: 'user', timestamp: new Date() }];
      const beforeDate = new Date('2023-01-01');

      const sortSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockResolvedValue(messages);

      (CartMessage.find as jest.Mock).mockReturnValue({
        sort: sortSpy,
        limit: limitSpy,
      });

      mockRequest.params = { cartId: '123' };
      mockRequest.query = { before: beforeDate.toISOString() };

      await getCartMessages(mockRequest as Request, mockResponse as Response);

      expect(CartMessage.find).toHaveBeenCalledWith({
        cartId: '123',
        timestamp: { $lt: expect.any(Date) }
      });
    });

    it('should handle database errors', async () => {
      (CartMessage.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockRequest.params = { cartId: '123' };

      await getCartMessages(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch messages' });
    });
  });

  describe('addCartMessage', () => {
    it('should return 400 if required fields are missing', async () => {
      mockRequest.params = { cartId: '123' };
      mockRequest.body = { sender: 'user' }; 

      await addCartMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Cart ID, sender and message are required'
      });
    });

    it('should add a new message', async () => {
      const newMessage = {
        id: '1',
        cartId: '123',
        sender: 'user',
        message: 'Hello',
        clientId: 'client1',
        timestamp: new Date(),
      };

      (CartMessage.create as jest.Mock).mockResolvedValue(newMessage);

      mockRequest.params = { cartId: '123' };
      mockRequest.body = {
        sender: 'user',
        message: 'Hello',
        clientId: 'client1'
      };

      await addCartMessage(mockRequest as Request, mockResponse as Response);

      expect(CartMessage.create).toHaveBeenCalledWith({
        cartId: '123',
        sender: 'user',
        message: 'Hello',
        clientId: 'client1',
        timestamp: expect.any(Date),
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(newMessage);
    });

    it('should handle database errors', async () => {
      (CartMessage.create as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      mockRequest.params = { cartId: '123' };
      mockRequest.body = {
        sender: 'user',
        message: 'Hello',
        clientId: 'client1'
      };

      await addCartMessage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to add message' });
    });
  });
});

describe('Chat Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/chat', chatRouter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:cartId', () => {
    it('should get messages for a cart', async () => {
      const messages = [
        { id: '1', message: 'Hello', sender: 'user', timestamp: new Date() }
      ];

      const sortSpy = jest.fn().mockReturnThis();
      const limitSpy = jest.fn().mockResolvedValue(messages);

      (CartMessage.find as jest.Mock).mockReturnValue({
        sort: sortSpy,
        limit: limitSpy,
      });

      const response = await request(app).get('/chat/123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.any(Array));
    });
  });

  describe('POST /:cartId', () => {
    it('should add a new message', async () => {
      const newMessage = {
        id: '1',
        cartId: '123',
        sender: 'user',
        message: 'Hello',
        clientId: 'client1',
        timestamp: new Date(),
      };

      (CartMessage.create as jest.Mock).mockResolvedValue(newMessage);

      const response = await request(app)
        .post('/chat/123')
        .send({
          sender: 'user',
          message: 'Hello',
          clientId: 'client1',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        sender: 'user',
        message: 'Hello',
      }));
    });
  });
});