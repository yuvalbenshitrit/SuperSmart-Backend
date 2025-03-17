import { Request, Response, NextFunction } from "express";
import storeModel from "../models/store";

export const createStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const newStore = new storeModel(req.body);
    const savedStore = await newStore.save();
    res.status(201).json(savedStore);
  } catch (error) {
    next(error);
  }
};

export const getStores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stores = await storeModel.find();
    res.status(200).json(stores);
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const store = await storeModel.findById(req.params.id);
    if (!store) {
      res.status(404).json({ message: "Store not found" });
      return;
    }
    res.status(200).json(store);
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updatedStore = await storeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStore) {
      res.status(404).json({ message: "Store not found" });
      return;
    }
    res.status(200).json(updatedStore);
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deletedStore = await storeModel.findByIdAndDelete(req.params.id);
    if (!deletedStore) {
      res.status(404).json({ message: "Store not found" });
      return;
    }
    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    next(error);
  }
};