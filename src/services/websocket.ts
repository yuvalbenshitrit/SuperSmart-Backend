// קובץ: src/websockets/socketServer.ts

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import CartMessage from "../models/cartMessage";

export let io: SocketIOServer;

export const setupWebsockets = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // החלף לדומיין ב-production
      methods: ["GET", "POST"],
    },
    // הגדרות נוספות לטיפול בחיבורים נופלים
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log("🔌 WebSocket connected:", socket.id);

    // Wishlist notification (כבר קיים)
    socket.on("subscribe-to-wishlists", (userId: string) => {
      socket.join(`user-${userId}`);
    });

    // 📥 הצטרפות לעגלת קניות
    socket.on("join-cart", (cartId: string) => {
      socket.join(`cart-${cartId}`);
      console.log(`🛒 User ${socket.id} joined cart ${cartId}`);
    });

    // 📤 יציאה מעגלה
    socket.on("leave-cart", (cartId: string) => {
      socket.leave(`cart-${cartId}`);
      console.log(`🚪 User ${socket.id} left cart ${cartId}`);
    });

    // 💬 קבלת הודעה
    socket.on("send-message", async ({ cartId, sender, message, clientId, timestamp }) => {
      if (!cartId || !message || !sender) {
        console.log("❌ Missing required fields for message");
        return;
      }

      try {
        // ✨ שמור למסד נתונים
        const newMessage = await CartMessage.create({
          cartId,
          sender,
          message,
          timestamp: timestamp || new Date(),
          clientId,
        });

        const messageToSend = {
          _id: newMessage._id,
          cartId,
          sender,
          message,
          timestamp: newMessage.timestamp.toISOString(),
          clientId,
        };

        console.log("💬 Message saved to DB and broadcast to cart:", cartId);
        
        // שלח לכל חברי העגלה (חדר) כולל השולח
        io.to(`cart-${cartId}`).emit("receive-message", messageToSend);
      } catch (err) {
        console.error("❌ Error saving chat message:", err);
        // אופציונלי: שלח התראת שגיאה למשתמש (לא חובה)
        socket.emit("message-error", { error: "Failed to save message" });
      }
    });

    // 📴 ניתוק
    socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected:", socket.id);
    });
  });

  return io;
};

// 📣 שליחת התראות על שינוי מחיר למשתמשים ב-wishlist (אם אתה משתמש בזה)
interface PriceChange {
  productId: string;
  [key: string]: unknown; // Replace or extend with more specific fields as needed
}

interface WishlistService {
  findWishlistsWithProduct(productId: string): Promise<Array<{ userId: string; _id: string; name: string }>>;
}

export const notifyPriceChanges = (
  io: SocketIOServer,
  priceChange: PriceChange,
  wishlistService: WishlistService
): void => {
  wishlistService
    .findWishlistsWithProduct(priceChange.productId)
    .then((wishlists) => {
      wishlists.forEach((wishlist) => {
        io.to(`user-${wishlist.userId}`).emit("price-drop", {
          ...priceChange,
          wishlistId: wishlist._id,
          wishlistName: wishlist.name,
        });
      });
    });
};