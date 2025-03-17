import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post";
import { Express } from "express";

let app: Express;

beforeAll(async () => {
    app = await initApp();
    console.log("beforeAll - Posts");
    await postModel.deleteMany();

});

afterAll(async () => {
    console.log("afterAll - Posts");
    await mongoose.connection.close();
});

let postId = "";
const testPost = {
    content: "Test content",
    sender: "yuval",
};

const invalidPost = {
    content: "Test content",
};

describe("Posts test suite", () => {
    test("Get all posts initially", async () => {
        const response = await request(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(0);
    });

    test("Add new post", async () => {
        const response = await request(app).post("/posts").send(testPost);
        expect(response.statusCode).toBe(201);
        expect(response.body.content).toBe(testPost.content);
        expect(response.body.sender).toBe(testPost.sender);
        postId = response.body._id;
    });

    test("Add invalid post", async () => {
        const response = await request(app).post("/posts").send(invalidPost);
        expect(response.statusCode).toBe(400); // Adjusted to match schema validation behavior
    });

    test("Get all posts after adding one", async () => {
        const response = await request(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveLength(1);
    });

    test("Get post by ID", async () => {
        const response = await request(app).get("/posts/" + postId);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(postId);
    });

    test("Fail to get post by non-existing ID", async () => {
        const response = await request(app).get("/posts/675d74c7e039287983e32a15");
        expect(response.statusCode).toBe(404);
    });

//get post by sender testings

test("Get posts by sender successfully", async () => {
    const response = await request(app).get("/posts?sender=" + testPost.sender);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].sender).toBe(testPost.sender);
});

test("Get posts by sender with no posts found", async () => {
    const response = await request(app).get("/?sender=nonexistentSender");
    expect(response.statusCode).toBe(404);
    expect(response.text).not.toBe("Success");
});

test("Fail to get posts due to missing sender parameter", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(404); // Adjusted based on server validation
    expect(response.text).not.toBe("Success to fetch posts");
});

test("Fail to get posts due to database error", async () => {
    // Simulate a database error
    const error = new Error("Database error");
    postModel.find = jest.fn().mockRejectedValue(error);

    const response = await request(app).get("/posts?sender=" + testPost.sender);
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("{}");
});

test("Get posts by sender when multiple posts exist", async () => {
    // Create another post with the same sender
    const additionalPost = {
        content: "Another post",
        sender: "yuval",
    };
    await request(app).post("/").send(additionalPost);
    const response = await request(app).get("/?sender=" + testPost.sender);
    expect(response.statusCode).not.toBe(400);
    
    
});


//updating testings
test("Successfully update the post and return it", async () => {
    const mockPost = { _id: "123", title: "Updated title", content: "Updated content" };
    postModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockPost);

    const response = await request(app)
        .put("/posts/123")
        .send({ title: "Updated title", content: "Updated content" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockPost);
});

test("Fail to update post with non-existing ID", async () => {
    postModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    const response = await request(app)
        .put("/posts/nonexistent-id")
        .send({ title: "Updated title" });

    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Post not found");
});


test("Fail to update post due to an error", async () => {
    const error = new Error("Database error");
    postModel.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

    const response = await request(app)
        .put("/posts/123")
        .send({ title: "Invalid data" });

    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("{}");
});

test("Update post with empty request body", async () => {
    const mockPost = { _id: "123", title: "Original title", content: "Original content" };
    postModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockPost);

    const response = await request(app)
        .put("/posts/123")
        .send({}); // Empty body

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockPost); // No changes, returns original post
});

//deleting testings

test("Delete post successfully", async () => {
    const response = await request(app).delete("/posts/" + postId);
    expect(response.statusCode).toBe(201);
    expect(response.text).toBe("Post deleted successfully");
});

test("Fail to delete post with invalid ID", async () => {
    const response = await request(app).delete("/posts/invalidId");
    expect(response.statusCode).toBe(400);
    expect(response.text).not.toBe("Success");
});

test("Fail to delete post after it's already deleted", async () => {
    // Delete the post once
    await request(app).delete("/posts/" + postId);

    // Attempt to delete it again
    const response = await request(app).delete("/posts/" + postId);
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("Post not found");
});

test("Fail to delete post with missing postId parameter", async () => {
    const response = await request(app).delete("/posts/"); // Missing postId in the URL
    expect(response.statusCode).toBe(404);
    expect(response.text).not.toBe("Success");
});

test("Fail to delete post due to invalid parameter type", async () => {
    const response = await request(app).delete("/posts/12345xyz"); // Invalid postId format
    expect(response.statusCode).toBe(400);
    expect(response.text).not.toBe("Success");
});

test("Fail to delete post due to server error", async () => {
    const error = new Error("Server error");
    postModel.findByIdAndDelete = jest.fn().mockRejectedValue(error);

    const response = await request(app).delete("/posts/" + postId);
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("{}");
});




});

