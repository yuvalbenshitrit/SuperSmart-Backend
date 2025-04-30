import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

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

export default {
  checkPriceChanges,
  checkRecentPriceChanges,
  checkProductPrices,
};
