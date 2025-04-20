import { Request, Response } from "express";
import cartModel from "../models/cart";

export const createCart = async (req: Request, res: Response) => {
  try {
    console.log("Creating cart with data:", req.body);
    const cart = await cartModel.create(req.body);
    res.status(201).json(cart);
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
};

export const getCartById = async (req: Request, res: Response) => {
  try {
    console.log("Fetching cart with ID:", req.params.id);
    const cart = await cartModel.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

export const getCartsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res
        .status(400)
        .json({ error: "userId query parameter is required" });
    }

    console.log("Fetching carts for user:", userId);
    const carts = await cartModel.find({
      $or: [{ ownerId: userId }, { participants: userId }],
    });
    res.status(200).json(carts);
  } catch (error) {
    console.error("Error fetching user carts:", error);
    res.status(500).json({ error: "Failed to fetch user carts" });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    console.log("Updating cart:", req.params.id, req.body);
    const cart = await cartModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    console.log("Deleting cart:", req.params.id);
    const result = await cartModel.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart:", error);
    res.status(500).json({ error: "Failed to delete cart" });
  }
};
