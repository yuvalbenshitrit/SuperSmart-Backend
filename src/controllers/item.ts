import { Request, Response } from "express";
import itemModel from "../models/item";
import mongoose from "mongoose";

const createItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body.name || !req.body.category) {
      return res.status(400).json({ message: "Missing required fields: name and category" });
    }

    // Validate storeId in storePrices if provided
    if (req.body.storePrices && Array.isArray(req.body.storePrices)) {
      for (const storePrice of req.body.storePrices) {
        if (!mongoose.isValidObjectId(storePrice.storeId)) {
          return res.status(400).json({ message: "Invalid storeId in storePrices" });
        }
      }
    }

    // Create the item without manually adding an 'id' field
    const newItem = new itemModel({
      ...req.body,
      // Remove the manual 'id' field as MongoDB will create _id automatically
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

export default { createItem, getItems, getItemById, updateItem, deleteItem };
