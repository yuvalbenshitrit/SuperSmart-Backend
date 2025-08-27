import { Request, Response, NextFunction } from "express";
import userModel, { iUser } from "../models/user";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Document } from "mongoose";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

// טיפוס מותאם אישית שמכיל userId מה-JWT
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

type Payload = {
  _id: string;
};

const client = new OAuth2Client();

const googleSignIn = async (req: Request, res: Response) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return res.status(400).send("Email not provided in Google credentials");
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({
        userName: payload?.name || email.split("@")[0],
        email: email,
        password: "0",
        profilePicture: payload?.picture,
        refreshTokens: [], 
      });
    }

    const tokens = generateTokens(user);
    if (!tokens) {
      return res.status(500).send("Token generation failed");
    }

    
    user.refreshTokens = [tokens.refreshToken]; 
    await user.save();

    res.status(200).send({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      profilePicture: user.profilePicture,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken, 
    });
  } catch (err) {
    console.error("Google sign in error:", err);
    return res
      .status(400)
      .send(err instanceof Error ? err.message : "An error occurred");
  }
};

const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userName, email, password, profilePicture } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: "Email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      userName,
      email,
      password: hashedPassword,
      profilePicture: profilePicture || null,
      refreshTokens: [],
    });

    const tokens = generateTokens(user);
    if (!tokens) {
      return res.status(500).send({ error: "Token generation failed" });
    }

    user.refreshTokens = [tokens.refreshToken];
    await user.save();

    return res.status(201).send({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      profilePicture: user.profilePicture,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

const generateTokens = (
  user: iUser
): { refreshToken: string; accessToken: string } | null => {
  if (process.env.TOKEN_SECRET === undefined) {
    return null;
  }
  const rand = Math.random();
  const accessToken = jwt.sign(
    {
      _id: user._id,
      rand: rand,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRATION || "10s" } as SignOptions
  );
  const refreshToken = jwt.sign(
    {
      _id: user._id,
      rand: rand,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || "7d" } as SignOptions
  );
  return { refreshToken: refreshToken, accessToken: accessToken };
};

const login = async (req: Request, res: Response) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      res.status(404).send({ error: "User not found" });
      return;
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).send("incorrect email or password");
      return;
    }
    const tokens = generateTokens(user);
    if (!tokens) {
      res.status(400).send({ error: "Token generation error" });
      return;
    }

    if (user.refreshTokens == null) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(200).send({
      ...tokens,
      _id: user._id,
      userName: user.userName,
      profilePicture: user.profilePicture,
      email: user.email,
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).send({ error: err.message || "An error occurred" });
    } else {
      res.status(400).send({ error: "An error occurred" });
    }
  }
};

const validateRefreshToken = (refreshToken: string | undefined) => {
  return new Promise<Document<unknown, object, iUser> & iUser>(
    (resolve, reject) => {
      if (!refreshToken || !process.env.TOKEN_SECRET) {
        reject("error");
        return;
      }

      jwt.verify(
        refreshToken,
        process.env.TOKEN_SECRET,
        async (err, payload) => {
          if (err) {
            reject(err);
            return;
          }

          const userId = (payload as Payload)._id;
          try {
            const user = await userModel.findById(userId);
            if (!user) {
              reject("error");
              return;
            }

            if (
              !user.refreshTokens ||
              !user.refreshTokens.includes(refreshToken)
            ) {
              user.refreshTokens = [];
              await user.save();
              reject(err);
              return;
            }

            resolve(user);
          } catch (err) {
            reject(err);
          }
        }
      );
    }
  );
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id, currentPassword, newPassword } = req.body; 
  const userIdFromToken = req.userId;

  if (id !== userIdFromToken) {
    res.status(403).send({ error: "Unauthorized" });
    return;
  }

  if (!currentPassword || !newPassword) {
    res.status(400).send({ error: "Missing required fields" });
    return;
  }

  try {
    const user = await userModel.findById(id); 
    if (!user) {
      res.status(404).send({ error: "User not found" });
      return;
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      res.status(403).send({ error: "Current password is incorrect" });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).send({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) return res.status(404).send({ error: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); 

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;
  await user.save();

  // הדפסת קישור במקום שליחה במייל
  console.log(`Reset link: http://yourfrontend.com/reset-password/${token}`);

  res.send({ message: "Reset email sent (log only for now)" });
};

const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const user = await userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).send({ error: "Invalid or expired token" });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.send({ message: "Password has been reset" });
};

const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).send("Refresh token is required");
    }

    const user = await validateRefreshToken(refreshToken).catch(() => null);
    if (!user) {
      return res.status(400).send("Invalid refresh token");
    }

    user.refreshTokens = (user.refreshTokens ?? []).filter(
      (token) => token !== refreshToken
    );
    await user.save();

    res.status(200).send("Logged out from all sessions");
  } catch (error) {
    console.error("Logout error:", error);
    res.status(400).send("Logout failed");
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const user = await validateRefreshToken(req.body.refreshToken);

    const tokens = generateTokens(user);
    if (!tokens) {
      res.status(400).send("error");
      return;
    }
    user.refreshTokens = user.refreshTokens!.filter(
      (token) => token !== req.body.refreshToken
    );
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(200).send({
      ...tokens,
      _id: user._id,
    });
  } catch {
    res.status(400).send("error");
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).send({ error: "Invalid input data" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const cartItemIndex = user.cart?.findIndex(
      (item) => item.productId === productId
    );

    if (cartItemIndex !== undefined && cartItemIndex >= 0) {
      if (quantity > 0) {
        user.cart![cartItemIndex].quantity = quantity;
      } else {
        user.cart!.splice(cartItemIndex, 1);
      }
    } else if (quantity > 0) {
      user.cart!.push({ productId, quantity });
    }

    await user.save();
    res.status(200).send(user.cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).send({ error: "Product ID is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    user.cart = user.cart?.filter((item) => item.productId !== productId) || [];
    await user.save();

    res.status(200).send(user.cart);
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const tokenHeader = req.headers["authorization"];
  const token = tokenHeader && tokenHeader.split(" ")[1];
  if (!token || !process.env.TOKEN_SECRET) {
    res.status(400).send("Access denied");
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) {
      res.status(400).send("Access denied");
    } else {
      req.userId = (payload as Payload)._id;
      next();
    }
  });
};

export default {
  googleSignIn,
  register,
  login,
  refresh,
  logout,
  updateUser,
  updateCart,
  deleteCartItem,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
