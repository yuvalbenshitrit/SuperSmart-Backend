import mongoose, { Schema, Document } from "mongoose";

export interface IPrice {
  date: Date;
  price: number;
}

export interface IStorePrice {
  storeId: mongoose.Types.ObjectId;
  prices: IPrice[];
}

export interface IItem extends Document {
  name: string;
  category: string;
  storePrices: IStorePrice[];
  image?: string; 
  code?: string;  
  barcode?: string; 
}

const priceSchema = new Schema<IPrice>({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
});

const storePriceSchema = new Schema<IStorePrice>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  prices: { type: [priceSchema], default: [] },
});

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    storePrices: { type: [storePriceSchema], default: [] },
    image: { type: String }, 
    code: { type: String },  
    barcode: { type: String }, 
  },
  { timestamps: true }
);

const itemModel = mongoose.model<IItem>("Item", itemSchema);

export default itemModel;