import { Types } from "mongoose";

export interface PriceChange {
  productId: Types.ObjectId | string;
  productName: string;
  storeId: Types.ObjectId | string;
  oldPrice: number;
  newPrice: number;
  changeDate: Date;
  image?: string;
}

export interface WishlistWithUser {
  _id: Types.ObjectId | string;
  userId: string;
  name: string;
  products: string[];
}

export interface WishlistService {
  findWishlistsWithProduct: (
    productId: string | Types.ObjectId
  ) => Promise<WishlistWithUser[]>;
}
