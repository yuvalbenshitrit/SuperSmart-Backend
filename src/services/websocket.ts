// קובץ: src/websockets/socketServer.ts

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import CartMessage from "../models/cartMessage";
import itemModel from "../models/item"; // Replace require() with import

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
    socket.on(
      "send-message",
      async ({ cartId, sender, message, clientId, timestamp }) => {
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
      }
    );

    // 🏠 Join a custom room
    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`🔗 User ${socket.id} joined room ${roomId}`);
    });

    // 🛠 Get active rooms (for debugging)
    socket.on("get-active-rooms", () => {
      const rooms = Array.from(io.sockets.adapter.rooms.keys());
      socket.emit("active-rooms", rooms);
      console.log("📋 Active rooms sent to client:", rooms);
    });

    // 🧪 Test cart notification
    socket.on(
      "testCartNotification",
      ({ cartId, productId, newPrice, oldPrice }) => {
        const testNotification = {
          cartId,
          productId,
          newPrice,
          oldPrice,
          message: `Test notification for cart ${cartId}`,
        };
        io.to(`cart-${cartId}`).emit("price-drop", testNotification);
        console.log("🧪 Test notification sent:", testNotification);
      }
    );

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
  newPrice: number;
  oldPrice: number;
  [key: string]: unknown; // Replace or extend with more specific fields as needed
}

interface WishlistService {
  findWishlistsWithProduct(
    productId: string
  ): Promise<Array<{ userId: string; _id: string; name: string }>>;
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
        const notification = {
          ...priceChange,
          wishlistId: wishlist._id,
          wishlistName: wishlist.name,
        };
        // Removed unnecessary delete operation as cartId does not exist on the notification object
        io.to(`user-${wishlist.userId}`).emit("price-drop", notification);
        console.log(
          `📣 Wishlist notification sent to user-${wishlist.userId}:`,
          notification
        );
      });
    })
    .catch((error) => {
      console.error("Error notifying wishlists about price changes:", error);
    });
};

interface CartService {
  findCartsWithProduct(productId: string): Promise<
    Array<{
      ownerId: string;
      participants: string[];
      notifications: boolean;
      _id: string;
    }>
  >;
}

export const notifyCartPriceChanges = (
  io: SocketIOServer,
  priceChange: PriceChange,
  cartService: CartService
): void => {
  cartService
    .findCartsWithProduct(priceChange.productId)
    .then(async (carts) => {
      if (!carts.length) {
        console.log(`No carts found for productId: ${priceChange.productId}`);
        return;
      }

      const product = await itemModel.findById(priceChange.productId).lean();
      if (!product) {
        console.error(
          `Product not found for productId: ${priceChange.productId}`
        );
        return;
      }

      carts.forEach((cart) => {
        if (cart.notifications) {
          const cartRoom = `cart-${cart._id}`;
          const notification = {
            ...priceChange,
            cartId: cart._id, // Ensure cartId is included
            productName: priceChange.productName || product.name,
            image: priceChange.image || product.image,
          };

          io.to(cartRoom).emit("price-drop", notification);
          console.log(
            `📣 Cart notification sent to ${cartRoom}:`,
            notification
          );
        }
      });
    })
    .catch((error) => {
      console.error("Error notifying carts about price changes:", error);
    });
};
