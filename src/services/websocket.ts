// קובץ: src/websockets/socketServer.ts

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import CartMessage from "../models/cartMessage";
import itemModel from "../models/item"; // Replace require() with import

export let io: SocketIOServer;

export const setupWebsockets = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        "https://supersmart.cs.colman.ac.il", 
        "http://localhost:3000",
        "http://10.10.248.141",
        "https://10.10.248.141"
      ],
       credentials: true,
      methods: ["GET", "POST"],
    },
    
    pingTimeout: 60000,
    pingInterval: 25000,
     transports: ['websocket', 'polling'],
  });

  io.on("connection", (socket: Socket) => {
    console.log("🔌 WebSocket connected:", socket.id);

   
    socket.on("subscribe-to-wishlists", (userId: string) => {
      socket.join(`user-${userId}`);
    });

    
    socket.on("join-cart", (cartId: string) => {
      socket.join(`cart-${cartId}`);
      console.log(`🛒 User ${socket.id} joined cart ${cartId}`);
    });

   
    socket.on("leave-cart", (cartId: string) => {
      socket.leave(`cart-${cartId}`);
      console.log(`🚪 User ${socket.id} left cart ${cartId}`);
    });

   
    socket.on(
      "send-message",
      async ({ cartId, sender, message, clientId, timestamp }) => {
        if (!cartId || !message || !sender) {
          console.log("❌ Missing required fields for message");
          return;
        }

        try {
         
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

          
          io.to(`cart-${cartId}`).emit("receive-message", messageToSend);

          
          io.to(`cart-${cartId}`).emit("new-chat-notification", {
            cartId,
            sender,
            message:
              message.length > 30 ? message.substring(0, 30) + "..." : message, // Shortened message
            timestamp: newMessage.timestamp.toISOString(),
            clientId,
          });
        } catch (err) {
          console.error("❌ Error saving chat message:", err);
          
          socket.emit("message-error", { error: "Failed to save message" });
        }
      }
    );

    
    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`🔗 User ${socket.id} joined room ${roomId}`);
    });

    
    socket.on("get-active-rooms", () => {
      const rooms = Array.from(io.sockets.adapter.rooms.keys());
      socket.emit("active-rooms", rooms);
      console.log("📋 Active rooms sent to client:", rooms);
    });

   
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

    
    socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected:", socket.id);
    });
  });

  return io;
};


interface PriceChange {
  productId: string;
  newPrice: number;
  oldPrice: number;
  [key: string]: unknown; 
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
            cartId: cart._id, 
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
