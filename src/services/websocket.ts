import { Server, Socket } from "socket.io";
import http from "http";
import { PriceChange, WishlistService, WishlistWithUser } from "../types"; // Updated import path

export const setupWebsockets = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("subscribe-to-wishlists", (userId: string) => {
      socket.join(`user-${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const notifyPriceChanges = (
  io: Server,
  priceChange: PriceChange,
  wishlistService: WishlistService
): void => {
  wishlistService
    .findWishlistsWithProduct(priceChange.productId)
    .then((wishlists: WishlistWithUser[]) => {
      wishlists.forEach((wishlist) => {
        io.to(`user-${wishlist.userId}`).emit("price-drop", {
          ...priceChange,
          wishlistId: wishlist._id,
          wishlistName: wishlist.name,
        });
      });
    });
};
