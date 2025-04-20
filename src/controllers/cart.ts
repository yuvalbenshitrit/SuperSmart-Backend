import { Request, Response } from "express";
import cartModel from "../models/cart";

export const createCart = async (req: Request, res: Response) => {
  try {
    const cart = await cartModel.create(req.body);
    res.status(201).json(cart);
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
};

export const getCartById = async (req: Request, res: Response) => {
  try {
    const cart = await cartModel.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    res.status(200).json(cart);
  } catch  {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

export const getCartsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;
    const carts = await cartModel.find({
      $or: [{ ownerId: userId }, { participants: userId }],
    });
    res.status(200).json(carts);
  } catch {
    res.status(500).json({ error: "Failed to fetch user carts" });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const cart = await cartModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(cart);
  } catch  {
    res.status(500).json({ error: "Failed to update cart" });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    await cartModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch  {
    res.status(500).json({ error: "Failed to delete cart" });
  }
};