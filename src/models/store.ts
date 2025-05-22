import mongoose, { Schema, Document } from "mongoose";

export interface IStore extends Document {
  name: string;
   address: string;
   lat: number;
  lng: number;
}

const storeSchema = new Schema<IStore>(
  {
  name: { type: String, required: true },
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  },
  { timestamps: true }
);

const StoreModel = mongoose.model<IStore>("Store", storeSchema);

export default StoreModel;