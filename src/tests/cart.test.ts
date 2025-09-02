import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import cartModel from "../models/cart";
import userModel from "../models/user";
import itemModel from "../models/item";
import { Express } from "express";

let app: Express;

beforeAll(async () => {
  const { app: initializedApp } = await initApp();
  app = initializedApp;
  
  await cartModel.deleteMany();
  await userModel.deleteMany();
  await itemModel.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

const baseUrl = "/carts";

type TestUser = {
  userName: string;
  email: string;
  password: string;
  _id?: string;
  accessToken?: string;
};

type TestCart = {
  name?: string;
  ownerId: string;
  participants?: string[];
  items: { productId: string; quantity: number }[];
  notifications?: boolean;
  _id?: string;
};

// Test users
const testUser1: TestUser = {
  userName: "CartOwner",
  email: "owner@test.com",
  password: "123456",
};

const testUser2: TestUser = {
  userName: "CartParticipant",
  email: "participant@test.com",
  password: "123456",
};

const testUser3: TestUser = {
  userName: "NonParticipant",
  email: "nonparticipant@test.com",
  password: "123456",
};

const registerAndLoginUser = async (user: TestUser): Promise<TestUser> => {
  await request(app)
    .post("/auth/register")
    .send(user);

  const loginResponse = await request(app)
    .post("/auth/login")
    .send({
      email: user.email,
      password: user.password,
    });

  user.accessToken = loginResponse.body.accessToken;
  user._id = loginResponse.body._id;
  return user;
};

// Helper function to create test item
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createTestItem = async (): Promise<any> => {
  const testItem = {
    name: "Test Product",
    category: "Test Category",
    storePrices: [{
      storeId: new mongoose.Types.ObjectId(),
      prices: [
        { date: new Date(), price: 10.99 },
        { date: new Date(Date.now() - 86400000), price: 12.99 } 
      ]
    }],
    nutrition: {
      protein: 5,
      fat: 2,
      carbs: 20,
      calories: 100,
      sodium: 50,
      calcium: null,
      vitamin_c: null,
      cholesterol: 0
    }
  };
  
  const item = await itemModel.create(testItem);
  return item;
};

describe("Cart Test Suite", () => {
  let loggedInOwner: TestUser;
  let loggedInParticipant: TestUser;
  let loggedInNonParticipant: TestUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testItem: any;
  let testCart: TestCart;

  beforeAll(async () => {
    loggedInOwner = await registerAndLoginUser(testUser1);
    loggedInParticipant = await registerAndLoginUser(testUser2);
    loggedInNonParticipant = await registerAndLoginUser(testUser3);

    testItem = await createTestItem();
  });

  describe("Cart Model Tests", () => {
    test("Should create a cart with valid data", async () => {
      const cartData = {
        name: "Test Cart",
        ownerId: loggedInOwner._id!,
        participants: [],
        items: [{ productId: testItem._id.toString(), quantity: 2 }],
        notifications: true,
      };

      const cart = await cartModel.create(cartData);
      expect(cart).toBeDefined();
      expect(cart.name).toBe(cartData.name);
      expect(cart.ownerId).toBe(cartData.ownerId);
      expect(cart.items).toHaveLength(1);
      expect(cart.notifications).toBe(true);
    });

    test("Should require ownerId", async () => {
      const cartData = {
        name: "Test Cart",
        participants: [],
        items: [],
      };

      await expect(cartModel.create(cartData)).rejects.toThrow();
    });

    test("Should have default notifications as true", async () => {
      const cartData = {
        ownerId: loggedInOwner._id!,
        items: [],
      };

      const cart = await cartModel.create(cartData);
      expect(cart.notifications).toBe(true);
    });

    test("Should populate participants correctly", async () => {
      const cartData = {
        name: "Test Cart with Participants",
        ownerId: loggedInOwner._id!,
        participants: [new mongoose.Types.ObjectId(loggedInParticipant._id!)],
        items: [],
      };

      const cart = await cartModel.create(cartData);
      const populatedCart = await cartModel.findById(cart._id).populate("participants", "userName email");
      
      expect(populatedCart?.participants).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((populatedCart?.participants[0] as any).userName).toBe(loggedInParticipant.userName);
    });
  });

  describe("Cart Routes Tests", () => {
    beforeEach(async () => {
      await cartModel.deleteMany();
    });

    describe("POST /carts", () => {
      test("Should create a new cart with valid data", async () => {
        const cartData = {
          name: "API Test Cart",
          ownerId: loggedInOwner._id!,
          items: [{ productId: testItem._id.toString(), quantity: 3 }],
        };

        const response = await request(app)
          .post(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(cartData);

        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe(cartData.name);
        expect(response.body.ownerId).toBe(cartData.ownerId);
        expect(response.body.items).toHaveLength(1);
      });

      test("Should fail without authentication", async () => {
        const cartData = {
          name: "Unauthorized Cart",
          ownerId: loggedInOwner._id!,
          items: [],
        };

        const response = await request(app)
          .post(baseUrl)
          .send(cartData);

        expect(response.statusCode).toBe(400);
      });

      test("Should fail without ownerId", async () => {
        const cartData = {
          name: "No Owner Cart",
          items: [],
        };

        const response = await request(app)
          .post(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(cartData);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("ownerId is required");
      });

      test("Should fail with invalid productId", async () => {
        const cartData = {
          name: "Invalid Product Cart",
          ownerId: loggedInOwner._id!,
          items: [{ productId: "invalid-id", quantity: 1 }],
        };

        const response = await request(app)
          .post(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(cartData);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toContain("Invalid productId");
      });
    });

    describe("GET /carts", () => {
      beforeEach(async () => {
        testCart = {
          name: "Owner Cart",
          ownerId: loggedInOwner._id!,
          items: [{ productId: testItem._id.toString(), quantity: 1 }],
        };

        const cart = await cartModel.create(testCart);
        testCart._id = cart._id.toString();

        await cartModel.create({
          name: "Participant Cart",
          ownerId: loggedInNonParticipant._id!,
          participants: [new mongoose.Types.ObjectId(loggedInOwner._id!)],
          items: [],
        });
      });

      test("Should get all carts for authenticated user", async () => {
        const response = await request(app)
          .get(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
      });

      test("Should fail without authentication", async () => {
        const response = await request(app).get(baseUrl);
        expect(response.statusCode).toBe(400);
      });
    });

    describe("GET /carts/:id", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdCart: any;

      beforeEach(async () => {
        const cartData = {
          name: "Get Cart Test",
          ownerId: loggedInOwner._id!,
          participants: [new mongoose.Types.ObjectId(loggedInParticipant._id!)],
          items: [{ productId: testItem._id.toString(), quantity: 2 }],
        };

        createdCart = await cartModel.create(cartData);
      });

      test("Should get cart by ID for owner", async () => {
        const response = await request(app)
          .get(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(createdCart._id.toString());
        expect(response.body.name).toBe(createdCart.name);
      });

      test("Should get cart by ID for participant", async () => {
        const response = await request(app)
          .get(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(createdCart._id.toString());
      });

      test("Should fail for non-participant", async () => {
        const response = await request(app)
          .get(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInNonParticipant.accessToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Unauthorized to view this cart");
      });

      test("Should return 404 for non-existent cart", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`${baseUrl}/${fakeId}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("Cart not found");
      });
    });

    describe("PUT /carts/:id", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdCart: any;

      beforeEach(async () => {
        const cartData = {
          name: "Update Cart Test",
          ownerId: loggedInOwner._id!,
          participants: [new mongoose.Types.ObjectId(loggedInParticipant._id!)],
          items: [{ productId: testItem._id.toString(), quantity: 1 }],
        };

        createdCart = await cartModel.create(cartData);
      });

      test("Should update cart for owner", async () => {
        const updateData = {
          name: "Updated Cart Name",
          items: [{ productId: testItem._id.toString(), quantity: 5 }],
        };

        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(updateData);

        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(updateData.name);
        expect(response.body.items[0].quantity).toBe(5);
      });

      test("Should update cart for participant", async () => {
        const updateData = {
          items: [{ productId: testItem._id.toString(), quantity: 3 }],
        };

        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`)
          .send(updateData);

        expect(response.statusCode).toBe(200);
        expect(response.body.items[0].quantity).toBe(3);
      });

      test("Should fail for non-participant", async () => {
        const updateData = { name: "Unauthorized Update" };

        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInNonParticipant.accessToken}`)
          .send(updateData);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Unauthorized to update this cart");
      });

      test("Should fail with invalid productId", async () => {
        const updateData = {
          items: [{ productId: "invalid-id", quantity: 1 }],
        };

        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(updateData);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toContain("Invalid productId");
      });
    });

    describe("DELETE /carts/:id", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdCart: any;

      beforeEach(async () => {
        const cartData = {
          name: "Delete Cart Test",
          ownerId: loggedInOwner._id!,
          participants: [new mongoose.Types.ObjectId(loggedInParticipant._id!)],
          items: [],
        };

        createdCart = await cartModel.create(cartData);
      });

      test("Should delete cart for owner", async () => {
        const response = await request(app)
          .delete(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Cart deleted successfully");

        const deletedCart = await cartModel.findById(createdCart._id);
        expect(deletedCart).toBeNull();
      });

      test("Should fail for participant (not owner)", async () => {
        const response = await request(app)
          .delete(`${baseUrl}/${createdCart._id}`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Only the owner can delete the cart");
      });

      test("Should return 404 for non-existent cart", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`${baseUrl}/${fakeId}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("Cart not found");
      });
    });

    describe("PUT /carts/:id/participants", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdCart: any;

      beforeEach(async () => {
        const cartData = {
          name: "Participant Test Cart",
          ownerId: loggedInOwner._id!,
          participants: [],
          items: [],
        };

        createdCart = await cartModel.create(cartData);
      });

      test("Should add participant by email for owner", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({ email: loggedInParticipant.email });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Participant added successfully");
        expect(response.body.cart.participants).toHaveLength(1);
      });

      test("Should fail for non-owner", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`)
          .send({ email: loggedInNonParticipant.email });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Only the cart owner can add participants");
      });

      test("Should fail with non-existent email", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({ email: "nonexistent@test.com" });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("User with this email not found");
      });

      test("Should fail when adding existing participant", async () => {
        await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({ email: loggedInParticipant.email });

        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({ email: loggedInParticipant.email });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("User is already a participant");
      });

      test("Should fail without email", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Email is required");
      });
    });

    describe("PUT /carts/:id/participants/remove", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let createdCart: any;

      beforeEach(async () => {
        const cartData = {
          name: "Remove Participant Test Cart",
          ownerId: loggedInOwner._id!,
          participants: [new mongoose.Types.ObjectId(loggedInParticipant._id!)],
          items: [],
        };

        createdCart = await cartModel.create(cartData);
      });

      test("Should remove participant for owner", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants/remove`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({ userIdToRemove: loggedInParticipant._id });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Participant removed successfully");
        expect(response.body.cart.participants).toHaveLength(0);
      });

      test("Should fail for non-owner", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants/remove`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`)
          .send({ userIdToRemove: loggedInParticipant._id });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Only the cart owner can remove participants");
      });

      test("Should fail when removing non-participant", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants/remove`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({ userIdToRemove: loggedInNonParticipant._id });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("User is not a participant in this cart");
      });

      test("Should fail without userIdToRemove", async () => {
        const response = await request(app)
          .put(`${baseUrl}/${createdCart._id}/participants/remove`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("User ID to remove is required");
      });
    });

    describe("GET /carts/price-drops", () => {
      beforeEach(async () => {
        await cartModel.create({
          name: "Price Drop Cart",
          ownerId: loggedInOwner._id!,
          items: [{ productId: testItem._id.toString(), quantity: 1 }],
        });
      });

      test("Should get price drops for user's cart items", async () => {
        const response = await request(app)
          .get(`${baseUrl}/price-drops`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty("productId");
          expect(response.body[0]).toHaveProperty("productName");
          expect(response.body[0]).toHaveProperty("oldPrice");
          expect(response.body[0]).toHaveProperty("newPrice");
          expect(response.body[0].newPrice).toBeLessThan(response.body[0].oldPrice);
        }
      });

      test("Should return empty array for user with no carts", async () => {
        const response = await request(app)
          .get(`${baseUrl}/price-drops`)
          .set("Authorization", `Bearer ${loggedInNonParticipant.accessToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
      });

      test("Should fail without authentication", async () => {
        const response = await request(app).get(`${baseUrl}/price-drops`);
        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe("Cart Controller Tests", () => {
    describe("Input Validation", () => {
      test("Should validate ObjectId format for productIds", async () => {
        const cartData = {
          name: "Validation Test Cart",
          ownerId: loggedInOwner._id!,
          items: [{ productId: "not-an-objectid", quantity: 1 }],
        };

        const response = await request(app)
          .post(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(cartData);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toContain("Invalid productId");
      });

      test("Should handle missing required fields gracefully", async () => {
        const response = await request(app)
          .post(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("ownerId is required");
      });
    });

    describe("Authorization", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let testCartForAuth: any;

      beforeEach(async () => {
        testCartForAuth = await cartModel.create({
          name: "Auth Test Cart",
          ownerId: loggedInOwner._id!,
          participants: [],
          items: [],
        });
      });

      test("Should properly check cart ownership for deletion", async () => {
        const response = await request(app)
          .delete(`${baseUrl}/${testCartForAuth._id}`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Only the owner can delete the cart");
      });

      test("Should allow both owner and participants to view cart", async () => {
        testCartForAuth.participants.push(new mongoose.Types.ObjectId(loggedInParticipant._id!));
        await testCartForAuth.save();

        const ownerResponse = await request(app)
          .get(`${baseUrl}/${testCartForAuth._id}`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);
        expect(ownerResponse.statusCode).toBe(200);

        const participantResponse = await request(app)
          .get(`${baseUrl}/${testCartForAuth._id}`)
          .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`);
        expect(participantResponse.statusCode).toBe(200);
      });
    });

    describe("Error Handling", () => {
      test("Should handle database errors gracefully", async () => {
        const response = await request(app)
          .get(`${baseUrl}/invalid-object-id`)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

        expect(response.statusCode).toBe(500);
      });

      test("Should handle empty notifications field properly", async () => {
        const cartData = {
          name: "Notifications Test",
          ownerId: loggedInOwner._id!,
          items: [],
          notifications: undefined,
        };

        const response = await request(app)
          .post(baseUrl)
          .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
          .send(cartData);

        expect(response.statusCode).toBe(201);
        expect(response.body.notifications).toBe(true); 
      });
    });
  });

  describe("Integration Tests", () => {
    test("Should handle complete cart lifecycle", async () => {
      const createResponse = await request(app)
        .post(baseUrl)
        .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
        .send({
          name: "Lifecycle Cart",
          ownerId: loggedInOwner._id!,
          items: [{ productId: testItem._id.toString(), quantity: 1 }],
        });

      expect(createResponse.statusCode).toBe(201);
      const cartId = createResponse.body._id;

      const addParticipantResponse = await request(app)
        .put(`${baseUrl}/${cartId}/participants`)
        .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
        .send({ email: loggedInParticipant.email });

      expect(addParticipantResponse.statusCode).toBe(200);

      const updateResponse = await request(app)
        .put(`${baseUrl}/${cartId}`)
        .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`)
        .send({
          items: [{ productId: testItem._id.toString(), quantity: 5 }],
        });

      expect(updateResponse.statusCode).toBe(200);

      const removeParticipantResponse = await request(app)
        .put(`${baseUrl}/${cartId}/participants/remove`)
        .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
        .send({ userIdToRemove: loggedInParticipant._id });

      expect(removeParticipantResponse.statusCode).toBe(200);

      const deleteResponse = await request(app)
        .delete(`${baseUrl}/${cartId}`)
        .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

      expect(deleteResponse.statusCode).toBe(200);

      const getResponse = await request(app)
        .get(`${baseUrl}/${cartId}`)
        .set("Authorization", `Bearer ${loggedInOwner.accessToken}`);

      expect(getResponse.statusCode).toBe(404);
    });

    test("Should handle concurrent cart updates", async () => {
      const cart = await cartModel.create({
        name: "Concurrent Test Cart",
        ownerId: loggedInOwner._id!,
        participants: [new mongoose.Types.ObjectId(loggedInParticipant._id!)],
        items: [{ productId: testItem._id.toString(), quantity: 1 }],
      });

      const update1Promise = request(app)
        .put(`${baseUrl}/${cart._id}`)
        .set("Authorization", `Bearer ${loggedInOwner.accessToken}`)
        .send({ items: [{ productId: testItem._id.toString(), quantity: 2 }] });

      const update2Promise = request(app)
        .put(`${baseUrl}/${cart._id}`)
        .set("Authorization", `Bearer ${loggedInParticipant.accessToken}`)
        .send({ items: [{ productId: testItem._id.toString(), quantity: 3 }] });

      const [response1, response2] = await Promise.all([update1Promise, update2Promise]);

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
    });
  });
});