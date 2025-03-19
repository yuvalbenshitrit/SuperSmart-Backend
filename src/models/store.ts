import mongoose, { Schema, Document } from "mongoose";

export interface IStore extends Document {
  storeId: string;
  name: string;
}

const storeSchema = new Schema<IStore>(
  {
    storeId: { type: String, required: true, unique: true }, // Ensure `storeId` is unique
    name: { type: String, required: true },
  },
  { timestamps: true } 
);

const StoreModel = mongoose.model<IStore>("Store", storeSchema);

export default StoreModel;