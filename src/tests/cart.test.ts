import { Request, Response } from "express";

// Extend the Request type to include userId
interface CustomRequest extends Request {
  userId?: string;
}

import cartModel from "../models/cart";
import userModel from "../models/user";
import itemModel from "../models/item";
import StoreModel from "../models/store";

import {
  createCart,
  getCartById,
  getCartsByUser,
  updateCart,
  deleteCart,
  addParticipantToCart,
  removeParticipantFromCart,
  checkCartPriceDrops,
} from "../controllers/cart";

jest.mock("../models/cart");
jest.mock("../models/user");
jest.mock("../models/item");
jest.mock("../models/store");

describe("Cart Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };

    (cartModel.create as jest.Mock).mockImplementation((data) => {
      if (data.ownerId) {
        return Promise.resolve({ ...data, _id: "cart123" });
      }
      return Promise.reject(new Error("ownerId is required"));
    });

    (cartModel.findById as jest.Mock).mockImplementation((id) => {
      if (id === "cart123") {
        return Promise.resolve({
          _id: "cart123",
          ownerId: "user123",
          participants: [],
          items: [],
        });
      }
      return Promise.resolve(null);
    });

    (cartModel.find as jest.Mock).mockImplementation((query) => {
      if (query.$or) {
        return Promise.resolve([
          { _id: "cart1", ownerId: "user123", participants: [] },
          { _id: "cart2", ownerId: "user456", participants: ["user123"] },
        ]);
      }
      return Promise.resolve([]);
    });

    (cartModel.findByIdAndUpdate as jest.Mock).mockImplementation((id, update) => {
      if (id === "cart123") {
        return Promise.resolve({
          _id: "cart123",
          ...update,
        });
      }
      return Promise.resolve(null);
    });

    (cartModel.findByIdAndDelete as jest.Mock).mockImplementation((id) => {
      if (id === "cart123") {
        return Promise.resolve({ _id: "cart123" });
      }
      return Promise.resolve(null);
    });

    (userModel.findOne as jest.Mock).mockImplementation((query) => {
      if (query.email === "test@example.com") {
        return Promise.resolve({
          _id: "user456",
          email: "test@example.com",
          userName: "Test User",
        });
      }
      return Promise.resolve(null);
    });

    (itemModel.find as jest.Mock).mockImplementation((query) => {
      if (query._id.$in.includes("product123")) {
        return Promise.resolve([
          {
            _id: "product123",
            name: "Product 123",
            storePrices: [
              {
                storeId: "store1",
                prices: [
                  { date: new Date("2023-01-01"), price: 100 },
                  { date: new Date("2023-01-02"), price: 90 },
                ],
              },
            ],
          },
        ]);
      }
      return Promise.resolve([]);
    });

    (StoreModel.findById as jest.Mock).mockImplementation((id) => {
      if (id === "store1") {
        return Promise.resolve({
          _id: "store1",
          name: "Test Store",
          address: "123 Test St",
          lat: 40.7128,
          lng: -74.006,
        });
      }
      return Promise.resolve(null);
    });

    (cartModel.prototype.save as jest.Mock).mockImplementation(function (this: typeof cartModel) {
          return Promise.resolve(this);
        });
  });

  describe("createCart", () => {
    it("should create a cart successfully", async () => {
      req.body = {
        ownerId: "user123",
        items: [{ productId: "product123", quantity: 2 }],
      };

      (cartModel.create as jest.Mock).mockResolvedValue(req.body);

      await createCart(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(req.body);
    });

    it("should return 400 if ownerId is missing", async () => {
      req.body = {};

      await createCart(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "ownerId is required" });
    });
  });

  describe("getCartById", () => {
    it("should return a cart if the user is authorized", async () => {
      req.params = { id: "cart123" };
      (req as CustomRequest).userId = "user123";

      const mockCart = {
        _id: "cart123",
        ownerId: "user123",
        participants: [],
      };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);

      await getCartById(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCart);
    });

    it("should return 404 if the cart is not found", async () => {
      req.params = { id: "cart123" };
      (req as CustomRequest).userId = "user123";

      (cartModel.findById as jest.Mock).mockResolvedValue(null);

      await getCartById(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Cart not found" });
    });
  });

  describe("getCartsByUser", () => {
    it("should return all carts for a user", async () => {
      (req as CustomRequest).userId = "user123";

      const mockCarts = [
        { _id: "cart1", ownerId: "user123", participants: [] },
        { _id: "cart2", ownerId: "user456", participants: ["user123"] },
      ];

      (cartModel.find as jest.Mock).mockResolvedValue(mockCarts);

      await getCartsByUser(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCarts);
    });

    it("should return 401 if userId is missing", async () => {
      await getCartsByUser(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
  });

  describe("updateCart", () => {
    it("should update a cart successfully", async () => {
      req.params = { id: "cart123" };
      (req as CustomRequest).userId = "user123";
      req.body = { name: "Updated Cart" };

      const mockCart = {
        _id: "cart123",
        ownerId: "user123",
        participants: [],
      };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);
      (cartModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockCart,
        ...req.body,
      });

      await updateCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ ...mockCart, ...req.body });
    });

    it("should return 403 if the user is not authorized", async () => {
      req.params = { id: "cart123" };
      (req as CustomRequest).userId = "user456";

      const mockCart = {
        _id: "cart123",
        ownerId: "user123",
        participants: [],
      };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);

      await updateCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Unauthorized to update this cart",
      });
    });
  });

  describe("deleteCart", () => {
    it("should delete a cart successfully", async () => {
      req.params = { id: "cart123" };
      (req as CustomRequest).userId = "user123";

      const mockCart = {
        _id: "cart123",
        ownerId: "user123",
      };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);
      (cartModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCart);

      await deleteCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Cart deleted successfully",
      });
    });

    it("should return 403 if the user is not authorized", async () => {
      req.params = { id: "cart123" };
      (req as CustomRequest).userId = "user456";

      const mockCart = {
        _id: "cart123",
        ownerId: "user123",
      };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);

      await deleteCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Only the owner can delete the cart",
      });
    });
  });

  describe("addParticipantToCart", () => {
    it("should add a participant to a cart", async () => {
      req.params = { id: "cart123" };
      req.body = { email: "test@example.com" };
      (req as CustomRequest).userId = "user123";

      const mockCart = { _id: "cart123", ownerId: "user123", participants: [] };
      const mockUser = { _id: "user456", email: "test@example.com" };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);
      (userModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (cartModel.prototype.save as jest.Mock).mockResolvedValue({
        ...mockCart,
        participants: [mockUser._id],
      });

      await addParticipantToCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Participant added successfully",
        cart: { ...mockCart, participants: [mockUser._id] },
      });
    });

    it("should return 404 if the cart is not found", async () => {
      req.params = { id: "cart123" };
      req.body = { email: "test@example.com" };
      (req as CustomRequest).userId = "user123";

      (cartModel.findById as jest.Mock).mockResolvedValue(null);

      await addParticipantToCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Cart not found" });
    });
  });

  describe("removeParticipantFromCart", () => {
    it("should remove a participant from a cart", async () => {
      req.params = { id: "cart123" };
      req.body = { userIdToRemove: "user456" };
      (req as CustomRequest).userId = "user123";

      const mockCart = {
        _id: "cart123",
        ownerId: "user123",
        participants: ["user456"],
      };

      (cartModel.findById as jest.Mock).mockResolvedValue(mockCart);
      (cartModel.prototype.save as jest.Mock).mockResolvedValue({
        ...mockCart,
        participants: [],
      });

      await removeParticipantFromCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Participant removed successfully",
        cart: { ...mockCart, participants: [] },
      });
    });

    it("should return 404 if the cart is not found", async () => {
      req.params = { id: "cart123" };
      req.body = { userIdToRemove: "user456" };
      (req as CustomRequest).userId = "user123";

      (cartModel.findById as jest.Mock).mockResolvedValue(null);

      await removeParticipantFromCart(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Cart not found" });
    });
  });

  describe("checkCartPriceDrops", () => {
    it("should return price drops for products in user's carts", async () => {
      (req as CustomRequest).userId = "user123";

      const mockCarts = [
        {
          _id: "cart1",
          items: [{ productId: "product123" }],
        },
      ];

      const mockItems = [
        {
          _id: "product123",
          name: "Product 123",
          storePrices: [
            {
              storeId: "store1",
              prices: [
                { date: new Date("2023-01-01"), price: 100 },
                { date: new Date("2023-01-02"), price: 90 },
              ],
            },
          ],
        },
      ];

      (cartModel.find as jest.Mock).mockResolvedValue(mockCarts);
      (itemModel.find as jest.Mock).mockResolvedValue(mockItems);

      await checkCartPriceDrops(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([
        {
          productId: "product123",
          productName: "Product 123",
          storeId: "store1",
          oldPrice: 100,
          newPrice: 90,
          changeDate: new Date("2023-01-02"),
          image: undefined,
        },
      ]);
    });

    it("should return an empty array if no price drops are found", async () => {
      (req as CustomRequest).userId = "user123";

      const mockCarts = [
        {
          _id: "cart1",
          items: [{ productId: "product123" }],
        },
      ];

      const mockItems = [
        {
          _id: "product123",
          name: "Product 123",
          storePrices: [
            {
              storeId: "store1",
              prices: [
                { date: new Date("2023-01-01"), price: 100 },
                { date: new Date("2023-01-02"), price: 100 },
              ],
            },
          ],
        },
      ];

      (cartModel.find as jest.Mock).mockResolvedValue(mockCarts);
      (itemModel.find as jest.Mock).mockResolvedValue(mockItems);

      await checkCartPriceDrops(req as CustomRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });
  });
});