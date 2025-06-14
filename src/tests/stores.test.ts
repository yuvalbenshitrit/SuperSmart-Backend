import { Request, Response } from "express";
import storeController from "../controllers/store";
import StoreModel from "../models/store";

// Mock the StoreModel
jest.mock("../models/store", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
}));

// Create mock instances for request and response
const mockRequest = () => {
  const req: Partial<Request> = {
    body: {},
    params: {}
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res as Response;
};

describe("Store Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createStore", () => {
    // Mock the constructor and save method
    const mockSave = jest.fn();

  

    it("should create a store successfully", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { name: "Test Store" };
      mockSave.mockResolvedValueOnce(undefined);

      await storeController.createStore(req, res);

      
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 400 if name is missing", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = {};

      await storeController.createStore(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Store name is required" });
    });

    it("should return 500 if there's an error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.body = { name: "Test Store" };
      mockSave.mockRejectedValueOnce(new Error("Database error"));

      await storeController.createStore(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      
    });
  });

  describe("getStores", () => {
    it("should get all stores successfully", async () => {
      const req = mockRequest();
      const res = mockResponse();
      const mockStores = [{ name: "Store 1" }, { name: "Store 2" }];

      (StoreModel.find as jest.Mock).mockResolvedValueOnce(mockStores);

      await storeController.getStores(req, res);

      expect(StoreModel.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStores);
    });
  });

  describe("getStoreById", () => {
    it("should get store by id successfully", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "123" };
      const mockStore = { name: "Store 1", storeId: "123" };

      (StoreModel.findOne as jest.Mock).mockResolvedValueOnce(mockStore);

      await storeController.getStoreById(req, res);

      expect(StoreModel.findOne).toHaveBeenCalledWith({ storeId: "123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStore);
    });

    it("should return 404 if store is not found", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "999" };

      (StoreModel.findOne as jest.Mock).mockResolvedValueOnce(null);

      await storeController.getStoreById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Store not found" });
    });

    it("should return 500 if there's an error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "123" };

      (StoreModel.findOne as jest.Mock).mockRejectedValueOnce(new Error("Database error"));

      await storeController.getStoreById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe("updateStore", () => {
    it("should update store successfully", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "123" };
      req.body = { name: "Updated Store" };
      const updatedStore = { name: "Updated Store", storeId: "123" };

      (StoreModel.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(updatedStore);

      await storeController.updateStore(req, res);

      expect(StoreModel.findOneAndUpdate).toHaveBeenCalledWith(
        { storeId: "123" },
        { name: "Updated Store" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedStore);
    });

    it("should return 404 if store is not found", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "999" };
      req.body = { name: "Updated Store" };

      (StoreModel.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null);

      await storeController.updateStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Store not found" });
    });

    it("should return 500 if there's an error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "123" };
      req.body = { name: "Updated Store" };

      (StoreModel.findOneAndUpdate as jest.Mock).mockRejectedValueOnce(new Error("Database error"));

      await storeController.updateStore(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe("deleteStore", () => {
    it("should delete store successfully", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "123" };
      const deletedStore = { name: "Deleted Store", storeId: "123" };

      (StoreModel.findOneAndDelete as jest.Mock).mockResolvedValueOnce(deletedStore);

      await storeController.deleteStore(req, res);

      expect(StoreModel.findOneAndDelete).toHaveBeenCalledWith({ storeId: "123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Store deleted successfully" });
    });

    it("should return 404 if store is not found", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "999" };

      (StoreModel.findOneAndDelete as jest.Mock).mockResolvedValueOnce(null);

      await storeController.deleteStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Store not found" });
    });

    it("should return 500 if there's an error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: "123" };

      (StoreModel.findOneAndDelete as jest.Mock).mockRejectedValueOnce(new Error("Database error"));

      await storeController.deleteStore(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });
});