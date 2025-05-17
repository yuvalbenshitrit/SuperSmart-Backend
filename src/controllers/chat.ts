import { Request, Response } from "express";
import CartMessage from "../models/cartMessage";

export const getCartMessages = async (req: Request, res: Response) => {
  try {
    const { cartId } = req.params;
    const { before } = req.query;

    if (!cartId) {
      return res.status(400).json({ error: "Cart ID is required" });
    }

    console.log(`Getting messages for cart: ${cartId}`);

    const query: { cartId: string; timestamp?: { $lt: Date } } = { cartId };

    if (before) {
      const beforeDate = new Date(before as string);
      if (!isNaN(beforeDate.getTime())) {
        query.timestamp = { $lt: beforeDate };
      }
    }

    // Get messages with most recent first, then reverse for chronological order
    const messages = await CartMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(30);

    const sortedMessages = messages.reverse();
    
    console.log(`Found ${sortedMessages.length} messages for cart ${cartId}`);
    
    return res.status(200).json(sortedMessages);
  } catch (error) {
    console.error("Error fetching cart messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const addCartMessage = async (req: Request, res: Response) => {
  try {
    const { cartId } = req.params;
    const { sender, message, clientId } = req.body;
    
    if (!cartId || !sender || !message) {
      return res.status(400).json({ error: "Cart ID, sender and message are required" });
    }
    
    console.log(`Adding new message from ${sender} to cart ${cartId}`);
    
    const newMessage = await CartMessage.create({
      cartId,
      sender,
      message,
      clientId,
      timestamp: new Date(),
    });
    
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error adding cart message:", error);
    return res.status(500).json({ error: "Failed to add message" });
  }
};

export default {
  getCartMessages,
  addCartMessage,
};