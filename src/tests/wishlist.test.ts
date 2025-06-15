import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import wishlistRoutes from "../routes/wishlist";
import wishlistModel from "../models/wishlist";

// Mock DB connection and model
jest.mock("../models/wishlist");

const app = express();
app.use(bodyParser.json());
app.use("/wishlists", wishlistRoutes);

const mockWishlist = {
    _id: "507f1f77bcf86cd799439011",
    name: "Test Wishlist",
    userId: "user123",
    products: ["prod1", "prod2"],
    save: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Wishlist Routes & Controller", () => {
    describe("POST /wishlists", () => {
        it("should create a wishlist", async () => {
            (wishlistModel.findOne as jest.Mock).mockResolvedValue(null);
            (wishlistModel.create as jest.Mock).mockResolvedValue(mockWishlist);

            const res = await request(app)
                .post("/wishlists")
                .send({ name: "Test Wishlist", userId: "user123" });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe("Test Wishlist");
            expect(wishlistModel.create).toHaveBeenCalled();
        });

        it("should not create wishlist if user already has one", async () => {
            (wishlistModel.findOne as jest.Mock).mockResolvedValue(mockWishlist);

            const res = await request(app)
                .post("/wishlists")
                .send({ name: "Test Wishlist", userId: "user123" });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/already has a wishlist/);
        });

        it("should return 400 if missing name or userId", async () => {
            const res = await request(app).post("/wishlists").send({ name: "" });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe("GET /wishlists", () => {
        it("should get wishlists by user", async () => {
            (wishlistModel.findOne as jest.Mock).mockResolvedValue(mockWishlist);

            const res = await request(app).get("/wishlists").query({ userId: "user123" });

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0].userId).toBe("user123");
        });

        it("should return 400 if userId is missing", async () => {
            const res = await request(app).get("/wishlists");
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe("GET /wishlists/:id", () => {
        it("should get wishlist by id", async () => {
            (wishlistModel.findById as jest.Mock).mockResolvedValue(mockWishlist);

            const res = await request(app).get(`/wishlists/${mockWishlist._id}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(mockWishlist._id);
        });

        it("should return 404 if wishlist not found", async () => {
            (wishlistModel.findById as jest.Mock).mockResolvedValue(null);

            const res = await request(app).get("/wishlists/unknownid");
            expect(res.status).toBe(404);
        });
    });

    describe("PUT /wishlists/:id", () => {
        it("should update wishlist", async () => {
            (wishlistModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
                ...mockWishlist,
                name: "Updated Name",
            });

            const res = await request(app)
                .put(`/wishlists/${mockWishlist._id}`)
                .send({ name: "Updated Name" });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Updated Name");
        });

        it("should return 404 if wishlist not found", async () => {
            (wishlistModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .put(`/wishlists/unknownid`)
                .send({ name: "Updated Name" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /wishlists/:id", () => {
        it("should delete wishlist", async () => {
            (wishlistModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockWishlist);

            const res = await request(app).delete(`/wishlists/${mockWishlist._id}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/deleted successfully/);
        });

        it("should return 404 if wishlist not found", async () => {
            (wishlistModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            const res = await request(app).delete(`/wishlists/unknownid`);
            expect(res.status).toBe(404);
        });
    });

    describe("POST /wishlists/:id/products", () => {
        it("should add product to wishlist", async () => {
            const wishlistWithSave = { ...mockWishlist, products: ["prod1"], save: jest.fn() };
            (wishlistModel.findById as jest.Mock).mockResolvedValue(wishlistWithSave);

            const res = await request(app)
                .post(`/wishlists/${mockWishlist._id}/products`)
                .send({ productId: "prod2" });

            expect(res.status).toBe(200);
            expect(wishlistWithSave.save).toHaveBeenCalled();
        });

        it("should return 400 if productId missing", async () => {
            const res = await request(app)
                .post(`/wishlists/${mockWishlist._id}/products`)
                .send({});
            expect(res.status).toBe(400);
        });

        it("should return 404 if wishlist not found", async () => {
            (wishlistModel.findById as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post(`/wishlists/${mockWishlist._id}/products`)
                .send({ productId: "prod2" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /wishlists/:id/products", () => {
        it("should remove product from wishlist", async () => {
            const wishlistWithSave = { ...mockWishlist, products: ["prod1", "prod2"], save: jest.fn() };
            (wishlistModel.findById as jest.Mock).mockResolvedValue(wishlistWithSave);

            const res = await request(app)
                .delete(`/wishlists/${mockWishlist._id}/products`)
                .send({ productId: "prod1" });

            expect(res.status).toBe(200);
            expect(wishlistWithSave.save).toHaveBeenCalled();
        });

        it("should return 400 if productId missing", async () => {
            const res = await request(app)
                .delete(`/wishlists/${mockWishlist._id}/products`)
                .send({});
            expect(res.status).toBe(400);
        });

        it("should return 404 if wishlist not found", async () => {
            (wishlistModel.findById as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .delete(`/wishlists/${mockWishlist._id}/products`)
                .send({ productId: "prod1" });

            expect(res.status).toBe(404);
        });
    });

    describe("GET /wishlists/single", () => {
        it("should return 404 if userId missing", async () => {
            const res = await request(app).get("/wishlists/single");
            expect(res.status).toBe(404);
        });
    });

    describe("GET /wishlists/user/:userId", () => {
        it("should get wishlist by userId", async () => {
            (wishlistModel.findOne as jest.Mock).mockResolvedValue(mockWishlist);

            const res = await request(app).get("/wishlists/user/user123");

            expect(res.status).toBe(200);
            expect(res.body.userId).toBe("user123");
        });

        it("should return 404 if wishlist not found", async () => {
            (wishlistModel.findOne as jest.Mock).mockResolvedValue(null);

            const res = await request(app).get("/wishlists/user/unknown");
            expect(res.status).toBe(404);
        });
    });
});