import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import itemModel from "../models/item";
import { Express } from "express";

let app: Express;

beforeAll(async () => {
    app = await initApp();
    console.log("beforeAll - items");
    await itemModel.deleteMany();

});

afterAll(async () => {
    console.log("afterAll - items");
    await mongoose.connection.close();
});

let itemId = "";
const testItem = {
    name: "Test Item",
    category: "Test Category",
    storePrices: [{ storeId: new mongoose.Types.ObjectId(), price: 10 }],
    suggestedAlternatives: [{ itemId: new mongoose.Types.ObjectId() }],
};

const invalidItem = {
    name: "Invalid Item",
};

describe("Items test suite", () => {
    test("Get all items initially", async () => {
        const response = await request(app).get("/items");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Add new item", async () => {
        const response = await request(app).post("/items").send(testItem);
        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe(testItem.name);
        expect(response.body.category).toBe(testItem.category);
        itemId = response.body._id;
    });

    test("Add invalid item", async () => {
        const response = await request(app).post("/items").send(invalidItem);
        expect(response.statusCode).toBe(400);
    });

    test("Get all items after adding one", async () => {
        const response = await request(app).get("/items");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
    });

    test("Get item by ID", async () => {
        const response = await request(app).get("/items/" + itemId);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(itemId);
    });

    test("Fail to get item by non-existing ID", async () => {
        const response = await request(app).get("/items/675d74c7e039287983e32a15");
        expect(response.statusCode).toBe(404);
    });

    test("Successfully update the item and return it", async () => {
        const updatedItem = { name: "Updated Item", category: "Updated Category" };
        const response = await request(app).put("/items/" + itemId).send(updatedItem);
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe(updatedItem.name);
        expect(response.body.category).toBe(updatedItem.category);
    });

    

    test("Delete item successfully", async () => {
        const response = await request(app).delete("/items/" + itemId);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Item deleted successfully");
    });

    test("Fail to delete item with invalid ID", async () => {
        const response = await request(app).delete("/items/invalidId");
        expect(response.statusCode).toBe(400);
    });

    test("Fail to delete item after it's already deleted", async () => {
        // Delete the item once
        await request(app).delete("/items/" + itemId);

        // Attempt to delete it again
        const response = await request(app).delete("/items/" + itemId);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe("Item not found");
    });

    test("Fail to update item with invalid data", async () => {
        const invalidUpdateData = { name: 12345 }; // Invalid data type for name
        const response = await request(app).put("/items/" + itemId).send(invalidUpdateData);
        expect(response.statusCode).toBe(404);
    });



    test("Fail to update non-existing item", async () => {
        const updatedItem = { name: "Updated Item", category: "Updated Category" };
        const nonExistingItemId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).put("/items/" + nonExistingItemId).send(updatedItem);
        expect(response.statusCode).toBe(404);
    });

    test("Fail to get item with invalid ID format", async () => {
        const response = await request(app).get("/items/invalidIdFormat");
        expect(response.statusCode).toBe(400);
    });

    test("Get all items when no items exist", async () => {
        await itemModel.deleteMany(); // Ensure no items exist
        const response = await request(app).get("/items");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Fail to create item with missing required fields", async () => {
        const missingFieldsItem = { category: "Test Category" }; // Missing 'name'
        const response = await request(app).post("/items").send(missingFieldsItem);
        expect(response.statusCode).toBe(400);
    });

    test("Create item with extra fields", async () => {
        const extraFieldsItem = { ...testItem, extraField: "This should be ignored" };
        const response = await request(app).post("/items").send(extraFieldsItem);
        expect(response.statusCode).toBe(201);
        expect(response.body.extraField).toBeUndefined(); // Ensure extra field is ignored
    });

    test("Fail to delete item with non-existing ID", async () => {
        const nonExistingItemId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).delete("/items/" + nonExistingItemId);
        expect(response.statusCode).toBe(404);
    });

    

});

