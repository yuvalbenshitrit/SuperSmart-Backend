import { Request, Response } from "express";
import itemModel from "../models/item";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCXx5QQ3MwNCcvjGKKO5xr1uOFbMUPExD4");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); //vision model for images


const createItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body.name || !req.body.category) {
      return res.status(400).json({ message: "Missing required fields: name and category" });
    }

    // Validate storeId and prices in storePrices if provided
    if (req.body.storePrices && Array.isArray(req.body.storePrices)) {
      for (const storePrice of req.body.storePrices) {
        if (!mongoose.isValidObjectId(storePrice.storeId)) {
          return res.status(400).json({ message: `Invalid storeId: ${storePrice.storeId}` });
        }
        for (const price of storePrice.prices) {
          if (!price.date || !price.price) {
            return res.status(400).json({ message: "Each price must have a date and a price" });
          }
        }
      }
    }

    // Create the item without manually adding an 'id' field
    const newItem = new itemModel({
      ...req.body,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

const getItems = async (req: Request, res: Response) => {
  try {
    const items = await itemModel.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const getItemById = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await itemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const updateItem = async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id;

    // Validate itemId
    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    // Validate storeId and prices in storePrices if provided
    if (req.body.storePrices && Array.isArray(req.body.storePrices)) {
      for (const storePrice of req.body.storePrices) {
        if (!mongoose.isValidObjectId(storePrice.storeId)) {
          return res.status(400).json({ message: `Invalid storeId: ${storePrice.storeId}` });
        }
        for (const price of storePrice.prices) {
          if (!price.date || !price.price) {
            return res.status(400).json({ message: "Each price must have a date and a price" });
          }
        }
      }
    }

    // Check if the item exists
    const existingItem = await itemModel.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item
    const updatedItem = await itemModel.findByIdAndUpdate(itemId, req.body, { new: true });
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteItem = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const deletedItem = await itemModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
const analyzeReceipt = async (req: Request, res: Response) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: "Please upload a receipt image." });
      }

      const imagePart = {
          inlineData: {
              mimeType: req.file.mimetype,
              data: Buffer.from(req.file.buffer).toString('base64'), // Convert buffer to base64 string
          },
      };

      const promptPart = {
          text: `Analyze the products listed in this receipt and return them as a clear, comma-separated list. If there are quantities, include them (e.g., "Milk x2, Bread, Apples x3").`,
      };

      const result = await model.generateContent([promptPart, imagePart]);
      const response = result.response;
      const aiContent = response.text();

      if (aiContent) {
          return res.status(200).json({ products: aiContent.trim() });
      } else {
          return res.status(500).json({ message: "Could not extract product information from the receipt." });
      }
  } catch (error) {
      console.error("Error analyzing receipt:", error);
      return res.status(500).json({ message: "Error analyzing receipt." });
  }
};

export default { createItem, getItems, getItemById, updateItem, deleteItem,analyzeReceipt };