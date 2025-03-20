import mongoose, { Schema, Document } from "mongoose";

export interface IStorePrice {
  storeId: mongoose.Types.ObjectId;
  price: number;
}

export interface IItem extends Document {
  name: string;
  category: string;
  storePrices: IStorePrice[];
}

const storePriceSchema = new Schema<IStorePrice>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  price: { type: Number, required: true },
});

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    storePrices: { type: [storePriceSchema], default: [] }
  },
  { timestamps: true }
);

// Add this code to properly initialize your model
const initializeItemModel = async () => {
  const itemModel = mongoose.model<IItem>("Item", itemSchema);
  
  try {
    // Check if the index exists and drop it if it does
    const collection = mongoose.connection.collection("items");
    const indexes = await collection.indexes();
    const hasIdIndex = indexes.some(index => index.name === "id_1");
    
    if (hasIdIndex) {
      await collection.dropIndex("id_1");
      console.log("Dropped legacy 'id_1' index");
    }
  } catch (error) {
    console.error("Error handling item model indexes:", error);
  }
  
  return itemModel;
};

// Use a temporary model for export that will be replaced once connected
let itemModel = mongoose.models.Item as mongoose.Model<IItem> || 
                mongoose.model<IItem>("Item", itemSchema);

// Update index handling when mongoose is connected
mongoose.connection.once("connected", async () => {
  itemModel = await initializeItemModel();
});

export default itemModel;