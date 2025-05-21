import { Request, Response } from "express";
import itemModel from "../models/item";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PriceChange } from "../types";
import StoreModel from "../models/store";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "AIzaSyCXx5QQ3MwNCcvjGKKO5xr1uOFbMUPExD4"
);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); //vision model for images

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

    // Validate itemId
    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    // Validate storeId and prices in storePrices if provided
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

    // Check if the item exists
    const existingItem = await itemModel.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item
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
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Please upload a receipt image." });
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

    const result = await model.generateContent([promptPart, imagePart]);
    const response = result.response;
    const aiContent = response.text();

    if (aiContent) {
      // More aggressive barcode extraction using regex
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

      // Fetch items from the database based on the extracted barcodes
      const itemsToAdd = await itemModel.find({
        barcode: { $in: extractedBarcodes },
      });

      if (itemsToAdd.length > 0) {
        const cartItems = itemsToAdd.map((item) => ({
          _id: item._id,
          quantity: 1, // Default quantity
          // You might want to include other relevant item details here if needed
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
    console.error("Error analyzing receipt:", error);
    return res.status(500).json({ message: "Error analyzing receipt." });
  }
};

export const checkPriceChanges = async (req: Request, res: Response) => {
  try {
    const { lastCheckedTimestamp, productIds } = req.query;

    // Validate the timestamp if provided
    if (
      lastCheckedTimestamp &&
      isNaN(Date.parse(lastCheckedTimestamp as string))
    ) {
      return res
        .status(400)
        .json({ message: "Invalid lastCheckedTimestamp format" });
    }

    // Parse productIds if provided
    const productIdsArray = productIds
      ? (productIds as string).split(",")
      : null;

    // Build the query
    const query: Record<string, unknown> = {};
    if (lastCheckedTimestamp) {
      query["storePrices.prices.date"] = {
        $gt: new Date(lastCheckedTimestamp as string),
      };
    }
    if (productIdsArray) {
      query["_id"] = { $in: productIdsArray };
    }

    // Fetch items matching the query
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

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // ...existing logic...
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
  predictPriceChange,
};
