import mongoose from "mongoose";

export interface iCart {
  name?: string;
  ownerId: string;
  participants: string[];
  items: { productId: string; quantity: number }[];
  createdAt?: Date;
  updatedAt?: Date;
}

const cartSchema = new mongoose.Schema<iCart>(
  {
    name: { type: String },
    ownerId: { type: String, required: true },
    participants: { type: [String], default: [] },
    items: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const cartModel = mongoose.model<iCart>("carts", cartSchema);
export default cartModel;