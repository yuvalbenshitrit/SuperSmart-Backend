import axios from "axios";
import { io, notifyCartPriceChanges } from "./websocket"; // Import 'io'
import cartModel from "../models/cart";


const API_BASE_URL = process.env.DOMAIN_BASE|| "https://supersmart.cs.colman.ac.il";


interface PriceChange {
  productId: string;
  newPrice: number;
  oldPrice: number;
  [key: string]: unknown; // Extend with additional fields if needed
}

export const checkPriceChanges = async (lastCheckedTimestamp: Date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/price-changes`, {
      params: { lastCheckedTimestamp: lastCheckedTimestamp.toISOString() },
    });
    return response;
  } catch (error) {
    console.error("Failed to check price changes:", error);
    throw error;
  }
};

export const checkRecentPriceChanges = async () => {
  const lastCheckedTimestamp = localStorage.getItem("lastPriceCheckTimestamp");
  const timestamp = lastCheckedTimestamp
    ? new Date(lastCheckedTimestamp)
    : new Date(0);

  try {
    const response = await checkPriceChanges(timestamp);
    localStorage.setItem("lastPriceCheckTimestamp", new Date().toISOString());
    return response;
  } catch (error) {
    console.error("Failed to check recent price changes:", error);
    throw error;
  }
};

export const checkProductPrices = async (productIds: string[]) => {
  if (!productIds.length) return { data: [] };

  try {
    const response = await axios.get(`${API_BASE_URL}/items/price-changes`, {
      params: { productIds: productIds.join(",") },
    });
    return response;
  } catch (error) {
    console.error("Error checking product prices:", error);
    throw error;
  }
};

export const findCartsWithProduct = async (productId: string) => {
  try {
    return await cartModel
      .find({ "items.productId": productId })
      .select("ownerId participants notifications _id")
      .lean()
      .then((carts) =>
        carts.map((cart) => ({
          ...cart,
          _id: cart._id.toString(), // Convert _id to string
          participants: cart.participants.map((participant) => participant.toString()), // Convert each participant ObjectId to string
        }))
      );
  } catch (error) {
    console.error("Error finding carts with product:", error);
    return [];
  }
};

export const handleCartPriceChanges = async (priceChange: PriceChange) => {
  try {
    console.log(
      "Handling cart price change for productId:",
      priceChange.productId
    );
    notifyCartPriceChanges(io, priceChange, { findCartsWithProduct });
  } catch (error) {
    console.error("Error handling cart price changes:", error);
  }
};

export const getCartPriceDrops = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/carts/price-drops`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cart price drops:", error);
    throw error;
  }
};

export default {
  checkPriceChanges,
  checkRecentPriceChanges,
  checkProductPrices,
  getCartPriceDrops,
};
