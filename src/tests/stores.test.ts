import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import storeModel from "../models/store";
import { Express } from "express";

let app: Express;

describe("Stores test suite", () => {
    let storeId: string;

    beforeAll(async () => {
        app = await initApp();
        console.log("beforeAll - Stores");
        await storeModel.deleteMany(); // Clean the database
    });

    afterAll(async () => {
        console.log("afterAll - Stores");
        await mongoose.connection.close();
    });

    const testStore = {
        storeId: "123",
        name: "Test Store",
    };

    const invalidStore = {
        name: "Invalid Store",
    };

    test("Get all stores initially", async () => {
        const response = await request(app).get("/stores");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Add new store", async () => {
        const response = await request(app).post("/stores").send(testStore);
        console.log("Created Store:", response.body); // Log the created store
        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe(testStore.name);
        storeId = response.body.storeId; // Ensure this is set correctly
    });

    test("Add invalid store", async () => {
        const response = await request(app).post("/stores").send(invalidStore);
        expect(response.statusCode).toBe(400);
    });

    test("Get all stores after adding one", async () => {
        const response = await request(app).get("/stores");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
    });

    test("Get store by ID", async () => {
        console.log("Fetching store with storeId:", storeId); // Log the storeId being used
        const response = await request(app).get("/stores/" + storeId);
        console.log("Response Body:", response.body); // Log the response body
        expect(response.statusCode).toBe(200);
        expect(response.body.storeId).toBe(storeId);
    });

    test("Fail to get store by non-existing ID", async () => {
        const response = await request(app).get("/stores/675d74c7e039287983e32a15");
        expect(response.statusCode).toBe(404);
    });

    test("Partially update store", async () => {
        const partialUpdate = { name: "Partially Updated Store" };
        const response = await request(app).put("/stores/" + storeId).send(partialUpdate);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(partialUpdate.name);
      });
      

    test("Successfully update the store and return it", async () => {
        const updatedStore = { name: "Updated Store" };
        const response = await request(app).put("/stores/" + storeId).send(updatedStore);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(updatedStore.name);
    });

    test("Fail to update store with non-existing ID", async () => {
        const response = await request(app).put("/stores/nonexistent-id").send({ name: "Updated Store" });
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Store not found"); // Check for `response.body.message`
    });

    test("Delete store successfully", async () => {
        const response = await request(app).delete("/stores/" + storeId);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Store deleted successfully");
    });

    test("Fail to delete store with invalid ID", async () => {
        const response = await request(app).delete("/stores/invalidId");
        expect(response.statusCode).toBe(404);
    });

    test("Fail to delete store after it's already deleted", async () => {
        // Delete the store once
        await request(app).delete("/stores/" + storeId);

        // Attempt to delete it again
        const response = await request(app).delete("/stores/" + storeId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Store not found");
    });

    // Additional Tests
    test("Fail to update store with invalid data", async () => {
        const invalidUpdateData = { name: 12345 }; // Invalid data type for name
        const response = await request(app).put("/stores/" + storeId).send(invalidUpdateData);
        expect(response.statusCode).toBe(404);
    });


    test("Fail to get store with invalid ID format", async () => {
        const response = await request(app).get("/stores/invalidIdFormat");
        expect(response.statusCode).toBe(404);
    });

    test("Get all stores when no stores exist", async () => {
        await storeModel.deleteMany(); // Ensure no stores exist
        const response = await request(app).get("/stores");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Fail to create store with missing required fields", async () => {
        const missingFieldsStore = { storeId: "123" }; // Missing 'name'
        const response = await request(app).post("/stores").send(missingFieldsStore);
        expect(response.statusCode).toBe(400);
    });

    test("Create store with extra fields", async () => {
        const extraFieldsStore = { ...testStore, extraField: "This should be ignored" };
        const response = await request(app).post("/stores").send(extraFieldsStore);
        expect(response.statusCode).toBe(201);
        expect(response.body.extraField).toBeUndefined(); // Ensure extra field is ignored
    });

    test("Fail to delete store with non-existing ID", async () => {
        const nonExistingStoreId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).delete("/stores/" + nonExistingStoreId);
        expect(response.statusCode).toBe(404);
    });
});