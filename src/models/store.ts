import mongoose, { Schema, Document } from "mongoose";

export interface IStore extends Document {
  name: string;
}

const storeSchema = new Schema<IStore>({
  name: { type: String, required: true },
});

const storeModel = mongoose.model<IStore>("Store", storeSchema);

export default storeModel;