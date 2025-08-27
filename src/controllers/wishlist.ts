import { Request, Response } from "express";
import mongoose from "mongoose"; 
import wishlistModel from "../models/wishlist";
import { WishlistWithUser } from "../types"; 

export const createWishlist = async (req: Request, res: Response) => {
  try {
    const { name, userId, products } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Name and userId are required" });
    }

    // Ensure only one wishlist per user
    const existingWishlist = await wishlistModel.findOne({ userId });
    if (existingWishlist) {
      return res.status(400).json({ error: "User already has a wishlist" });
    }

    const wishlist = await wishlistModel.create({
      name,
      userId,
      products: products || [],
    });

    res.status(201).json(wishlist);
  } catch (error) {
    console.error("Error creating wishlist:", error);
    res.status(500).json({ error: "Failed to create wishlist" });
  }
};

export const getWishlistById = async (req: Request, res: Response) => {
  try {
    const wishlist = await wishlistModel.findById(req.params.id);

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
};

export const getWishlistsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "userId query parameter is required" });
    }


    const wishlist = await wishlistModel.findOne({ userId });
    res.status(200).json(wishlist ? [wishlist] : []);
  } catch (error) {
    console.error("Error fetching user wishlist:", error);
    res.status(500).json({ error: "Failed to fetch user wishlist" });
  }
};

export const updateWishlist = async (req: Request, res: Response) => {
  try {
    const { name, products } = req.body;
    const updateData: { name?: string; products?: string[] } = {};

    if (name) updateData.name = name;
    if (products) updateData.products = products;

    const wishlist = await wishlistModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error updating wishlist:", error);
    res.status(500).json({ error: "Failed to update wishlist" });
  }
};

export const deleteWishlist = async (req: Request, res: Response) => {
  try {
    const result = await wishlistModel.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    res.status(200).json({ message: "Wishlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    res.status(500).json({ error: "Failed to delete wishlist" });
  }
};

export const addProductToWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const wishlist = await wishlistModel.findById(req.params.id);

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ error: "Failed to add product to wishlist" });
  }
};

export const removeProductFromWishlist = async (
  req: Request,
  res: Response
) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const wishlist = await wishlistModel.findById(req.params.id);

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter((id) => id !== productId);
    await wishlist.save();

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    res.status(500).json({ error: "Failed to remove product from wishlist" });
  }
};

export const findWishlistsWithProduct = async (
  productId: string | mongoose.Types.ObjectId
): Promise<WishlistWithUser[]> => {
  try {
    const wishlists = await wishlistModel.find({
      products: productId.toString(),
    });
    return wishlists;
  } catch (error) {
    console.error("Error finding wishlists with product:", error);
    return [];
  }
};

export const getOrCreateSingleWishlist = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "userId query parameter is required" });
    }

    let wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
      wishlist = await wishlistModel.create({
        name: "Default Wishlist",
        userId: userId as string,
        products: [],
      });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error fetching or creating single wishlist:", error);
    res.status(500).json({ error: "Failed to fetch or create wishlist" });
  }
};

export const getWishlistByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist by userId:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
};
