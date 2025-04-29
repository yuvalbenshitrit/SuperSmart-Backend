import mongoose from "mongoose";

export interface iWishlist {
  name: string;
  userId: string;
  products: string[]; // Array of product IDs
  createdAt?: Date;
  updatedAt?: Date;
}

const wishlistSchema = new mongoose.Schema<iWishlist>(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    products: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const wishlistModel = mongoose.model<iWishlist>("wishlists", wishlistSchema);
export default wishlistModel;
