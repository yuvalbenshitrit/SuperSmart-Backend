import mongoose from "mongoose";

export interface iUser {
  userName: string;
  email: string;
  password: string;
  _id?: string;
  refreshTokens?: string[];
  profilePicture?: string;
  googleId?: string;
  cart?: { productId: string; quantity: number }[];
   resetPasswordToken?: string;
   resetPasswordExpires?: Date;

}

const userSchema = new mongoose.Schema<iUser>({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshTokens: {
    type: [String],
    default: [],
  },
  profilePicture: {
    type: String,
  },
  googleId: {
    type: String,
    required: false,
  },
  cart: {
    type: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    default: [],
  },
  resetPasswordToken: {
  type: String,
},
resetPasswordExpires: {
  type: Date,
},

});

const userModel = mongoose.model<iUser>("users", userSchema);

export default userModel;
