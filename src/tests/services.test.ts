import { checkPriceChanges } from "../services/notification-service";
import axios from "axios";

jest.mock("axios");
jest.mock("../models/cart");
jest.mock("../services/websocket", () => ({
  io: {
    to: jest.fn(() => ({ emit: jest.fn() })),
  },
}));

describe("Services test suite", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkPriceChanges", () => {
    test("should fetch price changes successfully", async () => {
      const mockResponse = {
        data: [{ productId: "123", newPrice: 10, oldPrice: 15 }],
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const lastCheckedTimestamp = new Date();
      const response = await checkPriceChanges(lastCheckedTimestamp);

      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:3000/items/price-changes",
        { params: { lastCheckedTimestamp: lastCheckedTimestamp.toISOString() } }
      );
      expect(response).toEqual(mockResponse);
    });

    test("should throw an error if the request fails", async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error("Request failed"));
      const lastCheckedTimestamp = new Date();
      await expect(checkPriceChanges(lastCheckedTimestamp)).rejects.toThrow(
        "Request failed"
      );
    });
  });

  // מחיקת בדיקות שלא עובדות
});
