import mongoose from "mongoose";
import { Schema, model } from "mongoose";


const CartMessageSchema = new Schema(
  {
    cartId: {
      type: String,
      required: true,
      index: true, 
    },
    sender: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    clientId: {
      type: String,
    },
  },
  { timestamps: true }
);


const CartMessage = mongoose.models.CartMessage || model("CartMessage", CartMessageSchema);

export default CartMessage;