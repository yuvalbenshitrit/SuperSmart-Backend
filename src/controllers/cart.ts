import { Request, Response } from "express";
import cartModel from "../models/cart";
import userModel from "../models/user";
import { AuthenticatedRequest } from "./auth";
import itemModel from "../models/item"; // Import item model

export const createCart = async (req: Request, res: Response) => {
  try {
    console.log("Creating cart with data:", req.body);
    const cartData = {
      ...req.body,
      notifications: req.body.notifications ?? true,
    };
    const cart = await cartModel.create(cartData);
    res.status(201).json(cart);
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
};

export const getCartById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const cart = await cartModel.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const isAuthorized =
      cart.ownerId === userId || cart.participants.includes(userId!);

    if (!isAuthorized) {
      return res.status(403).json({ error: "Unauthorized to view this cart" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

export const getCartsByUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
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

export const updateCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const cart = await cartModel.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const isAuthorized =
      cart.ownerId === userId || cart.participants.includes(userId!);

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this cart" });
    }

    const updatedCart = await cartModel.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        notifications: req.body.notifications ?? cart.notifications,
      },
      { new: true }
    );

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
};

export const deleteCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const cart = await cartModel.findById(req.params.id);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    if (cart.ownerId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete the cart" });
    }

    await cartModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart:", error);
    res.status(500).json({ error: "Failed to delete cart" });
  }
};

export const addParticipantToCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const cartId = req.params.id;
    const { email } = req.body;
    const requesterId = req.userId;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cart = await cartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (cart.ownerId !== requesterId) {
      return res
        .status(403)
        .json({ error: "Only the cart owner can add participants" });
    }

    const userToAdd = await userModel.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    if (cart.participants.includes(userToAdd._id.toString())) {
      return res.status(400).json({ error: "User is already a participant" });
    }

    cart.participants.push(userToAdd._id.toString());
    await cart.save();

    res.status(200).json({ message: "Participant added successfully", cart });
  } catch (error) {
    console.error("Error adding participant to cart:", error);
    res.status(500).json({ error: "Failed to add participant" });
  }
};

export const removeParticipantFromCart = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const cartId = req.params.id;
    const { userIdToRemove } = req.body;
    const requesterId = req.userId;

    if (!userIdToRemove) {
      return res.status(400).json({ error: "User ID to remove is required" });
    }

    const cart = await cartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (cart.ownerId !== requesterId) {
      return res
        .status(403)
        .json({ error: "Only the cart owner can remove participants" });
    }

    const index = cart.participants.findIndex(
      (participantId) => participantId.toString() === userIdToRemove
    );

    if (index === -1) {
      return res
        .status(404)
        .json({ error: "User is not a participant in this cart" });
    }

    cart.participants.splice(index, 1);
    await cart.save();

    res.status(200).json({ message: "Participant removed successfully", cart });
  } catch (error) {
    console.error("Error removing participant from cart:", error);
    res.status(500).json({ error: "Failed to remove participant" });
  }
};

export const checkCartPriceDrops = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch all carts for the user
    const carts = await cartModel.find({
      $or: [{ ownerId: userId }, { participants: userId }],
    });

    if (!carts.length) {
      return res.status(200).json([]);
    }

    // Collect all product IDs from the user's carts
    const productIds = carts.flatMap((cart) =>
      cart.items.map((item) => item.productId)
    );

    // Fetch items with price drops
    const items = await itemModel.find({ _id: { $in: productIds } }).lean();

    const priceDrops = [];

    for (const item of items) {
      for (const storePrice of item.storePrices) {
        if (!storePrice.prices || storePrice.prices.length < 2) continue;

        const sortedPrices = [...storePrice.prices].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestPrice = sortedPrices[0];
        const previousPrice = sortedPrices[1];

        if (latestPrice.price < previousPrice.price) {
          priceDrops.push({
            productId: String(item._id),
            productName: item.name,
            storeId: storePrice.storeId,
            oldPrice: previousPrice.price,
            newPrice: latestPrice.price,
            changeDate: latestPrice.date,
            image: item.image,
          });
        }
      }
    }

    res.status(200).json(priceDrops);
  } catch (error) {
    console.error("Error checking cart price drops:", error);
    res.status(500).json({ error: "Failed to check cart price drops" });
  }
};
