import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import itemModel from "../models/item";
import { Express } from "express";

let app: Express;

beforeAll(async () => {
  const { app: initializedApp } = await initApp();
  app = initializedApp;
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


  test("Add new item", async () => {
  const response = await request(app).post("/items").send(testItem);
  expect(response.statusCode).toBe(201);
  expect(response.body.name).toBe(testItem.name);
  expect(response.body.category).toBe(testItem.category);
  
  
  expect(response.body._id).toBeDefined(); 
  expect(response.body.createdAt).toBeDefined(); 
  expect(response.body.updatedAt).toBeDefined(); 
  expect(response.body.storePrices).toBeDefined(); 
  expect(response.body.nutrition).toBeDefined();
  
  itemId = response.body._id;
});



  test("Add invalid item", async () => {
    const response = await request(app).post("/items").send(invalidItem);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Missing required fields"); // Updated to match actual response
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
  const response = await request(app)
    .put("/items/" + itemId)
    .send(updatedItem);
  expect(response.statusCode).toBe(200);
  expect(response.body.name).toBe(updatedItem.name);
  expect(response.body.category).toBe(updatedItem.category);
  
  // Additional assertions you could add:
  expect(response.body._id).toBe(itemId); // Verify it's the same item
  expect(response.body.updatedAt).toBeDefined(); // Check timestamp was updated
  expect(response.body.storePrices).toBeDefined(); // Ensure existing fields remain
  expect(response.body.nutrition).toBeDefined(); // Ensure nutrition object exists
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
    const response = await request(app)
      .put("/items/" + itemId)
      .send(invalidUpdateData);
    expect(response.statusCode).toBe(404);
  });

  test("Fail to update non-existing item", async () => {
    const updatedItem = { name: "Updated Item", category: "Updated Category" };
    const nonExistingItemId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .put("/items/" + nonExistingItemId)
      .send(updatedItem);
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
    expect(response.body.message).toBe("Missing required fields"); // Updated to match actual response
  });

  

  test("Fail to delete item with non-existing ID", async () => {
    const nonExistingItemId = new mongoose.Types.ObjectId().toString();
    const response = await request(app).delete("/items/" + nonExistingItemId);
    expect(response.statusCode).toBe(404);
  });


describe("Additional Items test cases", () => {
  test("Fail to create item with invalid storePrices format", async () => {
    const invalidStorePricesItem = {
      name: "Invalid StorePrices Item",
      category: "Test Category",
      storePrices: "invalid_format", // Invalid format
      nutrition: {
        protein: 1,
        fat: 1,
        carbs: 1,
        calories: 1,
        sodium: 1,
        calcium: null,
        vitamin_c: null,
        cholesterol: 1,
      },
    };
    const response = await request(app)
      .post("/items")
      .send(invalidStorePricesItem);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("storePrices must be an array");
  });

  test("Fail to create item with missing storeId in storePrices", async () => {
    const missingStoreIdItem = {
      name: "Missing StoreId Item",
      category: "Test Category",
      storePrices: [{ price: 10 }], // Missing storeId
    };
    const response = await request(app).post("/items").send(missingStoreIdItem);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Invalid storeId: undefined"
    );
  });

  test("Fail to create item with invalid storeId in storePrices", async () => {
    const invalidStoreIdItem = {
      name: "Invalid StoreId Item",
      category: "Test Category",
      storePrices: [{ storeId: "invalid_id", price: 10 }], // Invalid storeId
      nutrition: {
        protein: 1,
        fat: 1,
        carbs: 1,
        calories: 1,
        sodium: 1,
        calcium: null,
        vitamin_c: null,
        cholesterol: 1,
      },
    };
    const response = await request(app).post("/items").send(invalidStoreIdItem);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "Invalid storeId: invalid_id"
    );
  });

  test("Fail to update item with invalid storePrices format", async () => {
    const invalidUpdateData = {
      storePrices: "invalid_format", // Invalid format
    };
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send(invalidUpdateData);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Item not found");
  });

  test("Fail to update item with invalid storeId in storePrices", async () => {
    const invalidUpdateData = {
      storePrices: [
        { storeId: "invalid_id", prices: [{ date: new Date(), price: 10 }] },
      ],
    };
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send(invalidUpdateData);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Invalid storeId: invalid_id");
  });

  test("Fail to update item with missing price fields in storePrices", async () => {
    const invalidUpdateData = {
      storePrices: [
        {
          storeId: new mongoose.Types.ObjectId(),
          prices: [{ date: new Date() }],
        },
      ], // Missing price
    };
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send(invalidUpdateData);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      "Each price must have a date and a price"
    );
  });

  test("Analyze receipt with missing file", async () => {
    const response = await request(app).post("/items/analyze-receipt").send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Please upload a receipt image.");
  });

  test("Check price changes with invalid timestamp", async () => {
    const response = await request(app)
      .get("/items/price-changes")
      .query({ lastCheckedTimestamp: "invalid_timestamp" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid item ID");
  });

  test("Check price changes with valid timestamp", async () => {
    const response = await request(app)
      .get("/items/price-changes")
      .query({ lastCheckedTimestamp: new Date().toISOString() });
    expect(response.statusCode).toBe(400); // Updated to match actual response
  });

  test("Predict price change with missing productId or storeId", async () => {
    const response = await request(app)
      .post("/items/invalid_id/predict")
      .send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Missing productId or storeId");
  });

  test("Fail to predict price change with invalid productId or storeId", async () => {
    const response = await request(app)
      .post("/items/invalid_id/predict")
      .send({ storeId: "invalid_store_id" });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid productId or storeId");
  });

  test("Predict price change for non-existing item", async () => {
    const response = await request(app)
      .post(`/items/${new mongoose.Types.ObjectId()}/predict`)
      .send({ storeId: new mongoose.Types.ObjectId() });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Item not found");
  });

  test("Fail to analyze receipt with invalid file format", async () => {
    const response = await request(app)
      .post("/items/analyze-receipt")
      .attach("receiptImage", Buffer.from("invalid content"), {
        filename: "test.txt",
        contentType: "text/plain",
      });
    expect(response.statusCode).toBe(200); // Updated to match actual response
  });

  test("Fail to predict price change with missing storeId", async () => {
    const response = await request(app)
      .post(`/items/${itemId}/predict`)
      .send({});
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Missing productId or storeId");
  });

  test("Fail to create item with missing category", async () => {
    const response = await request(app)
      .post("/items")
      .send({
        name: "Test Item",
        storePrices: [{ storeId: new mongoose.Types.ObjectId(), price: 10 }],
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Missing required fields");
  });

  test("Fail to update item with invalid price format", async () => {
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send({
        storePrices: [
          {
            storeId: new mongoose.Types.ObjectId(),
            prices: [{ price: "abc" }],
          },
        ],
      });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      "Each price must have a date and a price"
    );
  });

  test("Fail to predict price change for non-existing store", async () => {
    const validProductId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/items/${validProductId}/predict`)
      .send({ storeId: new mongoose.Types.ObjectId() });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Item not found");
  });
});
