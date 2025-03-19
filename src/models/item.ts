import mongoose, { Schema, Document } from "mongoose";

export interface IStorePrice {
  storeId: mongoose.Types.ObjectId;
  price: number;
}

export interface ISuggestedAlternative {
  itemId: mongoose.Types.ObjectId;
}

export interface IItem extends Document {
  name: string;
  category: string;
  storePrices: IStorePrice[];
  id: string;
}

const storePriceSchema = new Schema<IStorePrice>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  price: { type: Number, required: true },
});



const itemSchema = new Schema<IItem>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  storePrices: { type: [storePriceSchema], default: [] },
  id: { type: String, required: true, unique: true },
});

const itemModel = mongoose.model<IItem>("Item", itemSchema);

export default itemModel;