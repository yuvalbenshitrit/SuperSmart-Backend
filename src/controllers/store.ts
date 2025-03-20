import { Request, Response } from "express";
import StoreModel from "../models/store";

const createStore = async (req: Request, res: Response) => {
  try {
    console.log("Request Body:", req.body);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Store name is required" });
    }

    const newStore = new StoreModel({ name });
    await newStore.save();

    res.status(201).json(newStore);
  } catch (error) {
    console.error("Error creating store:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

const getStores = async (req: Request, res: Response) => {
  try {
    const stores = await StoreModel.find();
    res.status(200).json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStoreById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await StoreModel.findOne({ storeId: id }); // Query by `storeId`

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json(store);
  } catch (error) {
    console.error("Error fetching store by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updatedStore = await StoreModel.findOneAndUpdate(
      { storeId: id },
      { name },
      { new: true } // Return the updated document
    );

    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json(updatedStore);
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedStore = await StoreModel.findOneAndDelete({ storeId: id });

    if (!deletedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
};