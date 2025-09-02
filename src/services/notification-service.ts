import axios from "axios";
import { io, notifyCartPriceChanges } from "./websocket"; 
import cartModel from "../models/cart";


const API_BASE_URL = process.env.DOMAIN_BASE|| "https://supersmart.cs.colman.ac.il";

const unreadMessages = new Map<string, Map<string, number>>(); 

interface PriceChange {
  productId: string;
  newPrice: number;
  oldPrice: number;
  [key: string]: unknown; 
}

export const checkPriceChanges = async (lastCheckedTimestamp: Date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/items/price-changes`, {
      params: { lastCheckedTimestamp: lastCheckedTimestamp.toISOString() },
    });
    return response;
  } catch (error) {
    console.error("Failed to check price changes:", error);
    throw error;
  }
};

export const checkRecentPriceChanges = async () => {
  const lastCheckedTimestamp = localStorage.getItem("lastPriceCheckTimestamp");
  const timestamp = lastCheckedTimestamp
    ? new Date(lastCheckedTimestamp)
    : new Date(0);

  try {
    const response = await checkPriceChanges(timestamp);
    localStorage.setItem("lastPriceCheckTimestamp", new Date().toISOString());
    return response;
  } catch (error) {
    console.error("Failed to check recent price changes:", error);
    throw error;
  }
};

export const checkProductPrices = async (productIds: string[]) => {
  if (!productIds.length) return { data: [] };

  try {
    const response = await axios.get(`${API_BASE_URL}/items/price-changes`, {
      params: { productIds: productIds.join(",") },
    });
    return response;
  } catch (error) {
    console.error("Error checking product prices:", error);
    throw error;
  }
};

export const findCartsWithProduct = async (productId: string) => {
  try {
    return await cartModel
      .find({ "items.productId": productId })
      .select("ownerId participants notifications _id")
      .lean()
      .then((carts) =>
        carts.map((cart) => ({
          ...cart,
          _id: cart._id.toString(), 
          participants: cart.participants.map((participant) => participant.toString()), 
        }))
      );
  } catch (error) {
    console.error("Error finding carts with product:", error);
    return [];
  }
};

export const handleCartPriceChanges = async (priceChange: PriceChange) => {
  try {
    console.log(
      "Handling cart price change for productId:",
      priceChange.productId
    );
    notifyCartPriceChanges(io, priceChange, { findCartsWithProduct });
  } catch (error) {
    console.error("Error handling cart price changes:", error);
  }
};

export const getCartPriceDrops = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/carts/price-drops`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cart price drops:", error);
    throw error;
  }
};

export const handleChatMessage = async (messageData: {
  chatId: string;
  senderId: string;
  message: string;
  timestamp: Date;
  participants: string[]; 
}) => {
  try {
    console.log("Handling chat message notification for chatId:", messageData.chatId);
    
    io.to(messageData.chatId).except(messageData.senderId).emit('newMessage', {
      chatId: messageData.chatId,
      senderId: messageData.senderId,
      message: messageData.message,
      timestamp: messageData.timestamp
    });

    const onlineUsers = new Set<string>();
    io.sockets.sockets.forEach((socket) => {
      if (socket.data?.userId) {
        onlineUsers.add(socket.data.userId);
      }
    });

    messageData.participants.forEach((userId) => {
      if (userId !== messageData.senderId && !onlineUsers.has(userId)) {
        incrementUnreadCount(userId, messageData.chatId);
      }
    });
    
  } catch (error) {
    console.error("Error handling chat message notification:", error);
  }
};

export const incrementUnreadCount = (userId: string, chatId: string) => {
  if (!unreadMessages.has(userId)) {
    unreadMessages.set(userId, new Map());
  }
  const userChats = unreadMessages.get(userId)!;
  const currentCount = userChats.get(chatId) || 0;
  userChats.set(chatId, currentCount + 1);
  console.log(`Incremented unread count for user ${userId} in chat ${chatId}: ${currentCount + 1}`);
};

export const getUnreadCounts = (userId: string) => {
  const userChats = unreadMessages.get(userId);
  if (!userChats) return {};
  
  const counts: { [chatId: string]: number } = {};
  userChats.forEach((count, chatId) => {
    counts[chatId] = count;
  });
  return counts;
};

export const markChatAsRead = (userId: string, chatId: string) => {
  const userChats = unreadMessages.get(userId);
  if (userChats) {
    userChats.delete(chatId);
    console.log(`Marked chat ${chatId} as read for user ${userId}`);
  }
};

export const onUserLogin = (userId: string) => {
  try {
    const unreadCounts = getUnreadCounts(userId);
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalUnread > 0) {
      io.sockets.sockets.forEach((socket) => {
        if (socket.data?.userId === userId) {
          socket.emit('unreadMessages', {
            totalUnread,
            chatCounts: unreadCounts
          });
          console.log(`Sent unread message notification to user ${userId}: ${totalUnread} messages`);
        }
      });
    }
  } catch (error) {
    console.error("Error handling user login notifications:", error);
  }
};

export const joinChatRoom = (userId: string, chatId: string) => {
  try {
    io.sockets.sockets.forEach((socket) => {
      if (socket.data?.userId === userId) {
        socket.join(chatId);
        console.log(`User ${userId} joined chat room ${chatId}`);
      }
    });
  } catch (error) {
    console.error("Error joining chat room:", error);
  }
};

export const leaveChatRoom = (userId: string, chatId: string) => {
  try {
    io.sockets.sockets.forEach((socket) => {
      if (socket.data?.userId === userId) {
        socket.leave(chatId);
        console.log(`User ${userId} left chat room ${chatId}`);
      }
    });
  } catch (error) {
    console.error("Error leaving chat room:", error);
  }
};

export default {
  checkPriceChanges,
  checkRecentPriceChanges,
  checkProductPrices,
  getCartPriceDrops,
  handleChatMessage,
  joinChatRoom,
  leaveChatRoom,
  onUserLogin,
  markChatAsRead,
  getUnreadCounts,
};