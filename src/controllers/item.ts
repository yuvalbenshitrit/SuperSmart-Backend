import { Request, Response } from "express";
import itemModel from "../models/item";
import wishlistModel from "../models/wishlist";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PriceChange } from "../types";
import StoreModel from "../models/store";

dotenv.config();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "AIzaSyCXx5QQ3MwNCcvjGKKO5xr1uOFbMUPExD4"
);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

const createItem = async (req: Request, res: Response) => {
  try {
    const { name, category, storePrices } = req.body;

    if (!name || !category || !storePrices) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(storePrices)) {
      return res.status(400).json({ message: "storePrices must be an array" });
    }

    for (const storePrice of storePrices) {
      if (
        !storePrice.storeId ||
        !mongoose.isValidObjectId(storePrice.storeId)
      ) {
        return res
          .status(400)
          .json({ message: `Invalid storeId: ${storePrice.storeId}` });
      }
      if (!storePrice.price) {
        return res
          .status(400)
          .json({ message: "Each storePrice must have a price" });
      }
    }

    const newItem = new itemModel({ name, category, storePrices });
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

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    if (req.body.storePrices && Array.isArray(req.body.storePrices)) {
      for (const storePrice of req.body.storePrices) {
        if (!mongoose.isValidObjectId(storePrice.storeId)) {
          return res
            .status(400)
            .json({ message: `Invalid storeId: ${storePrice.storeId}` });
        }
        for (const price of storePrice.prices) {
          if (!price.date || !price.price) {
            return res
              .status(400)
              .json({ message: "Each price must have a date and a price" });
          }
        }
      }
    }

    const existingItem = await itemModel.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updatedItem = await itemModel.findByIdAndUpdate(itemId, req.body, {
      new: true,
    });
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
    console.log("🔍 Starting receipt analysis...");

    if (!req.file) {
      console.log("❌ No file uploaded");
      return res
        .status(400)
        .json({ message: "Please upload a receipt image." });
    }

    console.log("📁 File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("🔑 API Key status:", apiKey ? "Available" : "Missing");

    if (!apiKey) {
      console.log("❌ GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({
        message: "Gemini API key is not configured. Please contact administrator."
      });
    }

    const imagePart = {
      inlineData: {
        mimeType: req.file.mimetype,
        data: Buffer.from(req.file.buffer).toString("base64"),
      },
    };

    const promptPart = {
      text: `Analyze the products listed in this receipt. For each distinct product line, identify any sequence of digits that looks like a barcode. Return all *unique* sequences of 8 to 14 digits found on the receipt as a clear, comma-separated list. Exclude any numbers that are clearly prices or quantities if possible, but prioritize returning any digit sequence that could be a barcode.`,
    };

    console.log("🤖 Calling Gemini API...");
    const result = await model.generateContent([promptPart, imagePart]);
    console.log("✅ Gemini API call successful");

    const response = result.response;
    const aiContent = response.text();
    console.log("📝 AI Response:", aiContent);

    if (aiContent) {
      const barcodeRegex = /\b\d{8,14}\b/g;
      const potentialBarcodes = aiContent.match(barcodeRegex) || [];
      const extractedBarcodes = [
        ...new Set(
          potentialBarcodes
            .map((barcode) => barcode.trim())
            .filter((barcode) => barcode)
        ),
      ];

      console.log("Potential Barcodes Extracted:", extractedBarcodes); // Debugging

      const itemsToAdd = await itemModel.find({
        barcode: { $in: extractedBarcodes },
      });

      if (itemsToAdd.length > 0) {
        const cartItems = itemsToAdd.map((item) => ({
          _id: item._id,
          quantity: 1, 
        }));
        return res.status(200).json({ cartItems });
      } else {
        return res
          .status(200)
          .json({ message: "No products found with the extracted barcodes." });
      }
    } else {
      return res.status(500).json({
        message: "Could not extract barcode information from the receipt.",
      });
    }
  } catch (error) {
    console.error("❌ Error analyzing receipt:", error);

    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      if (error.message.includes('API_KEY')) {
        return res.status(500).json({
          message: "Invalid API key configuration."
        });
      }

      if (error.message.includes('QUOTA_EXCEEDED')) {
        return res.status(500).json({
          message: "API quota exceeded. Please try again later."
        });
      }

      if (error.message.includes('PERMISSION_DENIED')) {
        return res.status(500).json({
          message: "API permission denied. Check your API key permissions."
        });
      }
    }

    return res.status(500).json({
      message: "Error analyzing receipt. Please try again or contact support.",
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const checkPriceChanges = async (req: Request, res: Response) => {
  try {
    const { lastCheckedTimestamp, productIds } = req.query;

    if (
      lastCheckedTimestamp &&
      isNaN(Date.parse(lastCheckedTimestamp as string))
    ) {
      return res
        .status(400)
        .json({ message: "Invalid lastCheckedTimestamp format" });
    }

    const productIdsArray = productIds
      ? (productIds as string).split(",")
      : null;

    const query: Record<string, unknown> = {};
    if (lastCheckedTimestamp) {
      query["storePrices.prices.date"] = {
        $gt: new Date(lastCheckedTimestamp as string),
      };
    }
    if (productIdsArray) {
      query["_id"] = { $in: productIdsArray };
    }

    const items = await itemModel.find(query).lean().exec();

    const priceChanges: PriceChange[] = [];

    for (const item of items) {
      for (const storePrice of item.storePrices) {
        if (!storePrice.prices || storePrice.prices.length < 2) continue;

        const sortedPrices = [...storePrice.prices].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestPrice = sortedPrices[0];
        const previousPrice = sortedPrices[1];

        if (latestPrice.price < previousPrice.price) {
          priceChanges.push({
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

    res.status(200).json(priceChanges);
  } catch (error) {
    console.error("Error checking price changes:", error);
    res.status(500).json({ message: "Failed to check price changes" });
  }
};

export const checkWishlistPriceChanges = async (req: Request, res: Response) => {
  try {
    const { lastCheckedTimestamp, onlyWishlistItems, userId } = req.query;

    if (onlyWishlistItems === 'true' && !userId) {
      return res
        .status(400)
        .json({ message: "userId is required when onlyWishlistItems is true" });
    }

    if (
      lastCheckedTimestamp &&
      isNaN(Date.parse(lastCheckedTimestamp as string))
    ) {
      return res
        .status(400)
        .json({ message: "Invalid lastCheckedTimestamp format" });
    }

    let productIdsArray: string[] | null = null;

    if (onlyWishlistItems === 'true' && userId) {
      const wishlist = await wishlistModel.findOne({ userId: userId as string });
      if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
        return res.status(200).json([]);
      }
      productIdsArray = wishlist.products;
    }

    const query: Record<string, unknown> = {};
    if (lastCheckedTimestamp) {
      query["storePrices.prices.date"] = {
        $gt: new Date(lastCheckedTimestamp as string),
      };
    }
    if (productIdsArray) {
      query["_id"] = { $in: productIdsArray };
    }

    const items = await itemModel.find(query).lean().exec();

    const priceChanges: PriceChange[] = [];

    for (const item of items) {
      for (const storePrice of item.storePrices) {
        if (!storePrice.prices || storePrice.prices.length < 2) continue;

        const sortedPrices = [...storePrice.prices].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestPrice = sortedPrices[0];
        const previousPrice = sortedPrices[1];

        if (latestPrice.price < previousPrice.price) {
          priceChanges.push({
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

    res.status(200).json(priceChanges);
  } catch (error) {
    console.error("Error checking wishlist price changes:", error);
    res.status(500).json({ message: "Failed to check wishlist price changes" });
  }
};

export const predictPriceChange = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { storeId } = req.body;

    if (!productId || !storeId) {
      return res.status(400).json({ message: "Missing productId or storeId" });
    }

    if (
      !mongoose.isValidObjectId(productId) ||
      !mongoose.isValidObjectId(storeId)
    ) {
      return res.status(400).json({ message: "Invalid productId or storeId" });
    }

    const item = await itemModel.findById(productId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const storePriceEntries = item.storePrices.filter(
      sp => sp.storeId.toString() === storeId
    );

    if (storePriceEntries.length === 0) {
      return res.status(200).json({
        message: "No price data found for this store.",
        productId,
        productName: item.name,
        storeId,
        prediction: null
      });
    }

    const allPrices: Array<{ date: Date; price: number }> = [];
    storePriceEntries.forEach(storePrice => {
      if (storePrice.prices && storePrice.prices.length > 0) {
        storePrice.prices.forEach(priceEntry => {
          allPrices.push({
            date: priceEntry.date,
            price: priceEntry.price
          });
        });
      }
    });

    if (allPrices.length < 3) {
      return res.status(200).json({
        message: "Not enough price history for prediction (need at least 3 points).",
        productId,
        productName: item.name,
        storeId,
        prediction: null
      });
    }

    let storeName = "Unknown Store";
    try {
      const store = await StoreModel.findById(storeId);
      if (store) {
        storeName = store.name;
      }
    } catch {
      console.log("Store not found in database, using legacy data handling");
    }

    const sortedPrices = [...allPrices].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const recentPrices = sortedPrices.slice(0, 5); 

    const priceHistory = recentPrices
      .map(p => `Date: ${p.date.toISOString().split("T")[0]}, Price: $${p.price}`)
      .join("\n");

    const prompt = `
    Analyze the following price history for product "${item.name}" at store "${storeName}":
    
    ${priceHistory}
    
    Based on this price trend, predict whether the price will increase, decrease, or stay stable in the next week.
    Also estimate the potential percentage change and provide a confidence level (1-10).
    
    Respond in the following JSON format:
    {
      "prediction": "increase|decrease|stable",
      "estimatedChange": "percentage as number (e.g., 5.2 for 5.2%)",
      "confidence": "number from 1-10",
      "reasoning": "brief explanation of the prediction"
    }
    `;

    console.log("🤖 Calling Gemini API for price prediction...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiContent = response.text();

    console.log("📝 AI Response:", aiContent);

    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const prediction = JSON.parse(jsonMatch[0]);

      if (!prediction.prediction || !prediction.confidence) {
        throw new Error("Invalid prediction format");
      }

      const predictionResult = {
        ...prediction,
        productId,
        productName: item.name,
        storeId,
        storeName,
        currentPrice: recentPrices[0].price,
        predictionDate: new Date(),
        basedOnDataPoints: recentPrices.length
      };

      res.status(200).json(predictionResult);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      res.status(500).json({
        message: "Could not parse price prediction from AI response",
        rawResponse: aiContent
      });
    }
  } catch (error) {
    console.error("Error predicting price change:", error);
    res.status(500).json({ message: "Failed to predict price change." });
  }
};


export default {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  analyzeReceipt,
  checkPriceChanges,
  checkWishlistPriceChanges,
  predictPriceChange,
};
