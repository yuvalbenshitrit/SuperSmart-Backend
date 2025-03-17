import mongoose from "mongoose";

export interface iUser {
  userName: string;
  email: string;
  password: string;
  _id?: string;
  refreshTokens?: string[];
  profilePicture?: string;  
  googleId?: string;
  
}

const userSchema = new mongoose.Schema<iUser>({
  userName: { 
    type: String,
    required: true,
    unique: true 
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
});

const userModel = mongoose.model<iUser>("users", userSchema);

export default userModel;
