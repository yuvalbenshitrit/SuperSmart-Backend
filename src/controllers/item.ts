import { Request, Response } from "express";
import itemModel from "../models/item";

const createItem = async (req: Request, res: Response) => {
  try {
    const newItem = new itemModel(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
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

const getItemById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const item = await itemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

const updateItem = async (req: Request, res: Response) => {
  try {
    const updatedItem = await itemModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

const deleteItem = async (req: Request, res: Response) => {
  try {
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