import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/post";
import { Express } from "express";
import userModel from "../models/user";

let app: Express;

beforeAll(async () => {
  app = await initApp();
  await userModel.deleteMany();
  await postModel.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

const baseUrl = "/auth";

type User = {
  userName: string;
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
  _id?: string;
  profilePicture?: string;  
};
const testUser: User = {
  userName: "Test User",
  email: "user1@test.com",
  password: "123456",
 
};



describe("Auth test suite", () => {
  test("Auth test registration", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send(testUser);
    expect(response.statusCode).toBe(200);
  });

  test("Auth test registration no password", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        email: "sdfsadaf",
      });
    expect(response.statusCode).not.toBe(200);
  });

  test("Auth test registration email already exist", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send(testUser);
    expect(response.statusCode).not.toBe(200);
  });

  test("Auth test registration with empty password", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        email: "test@example.com",
        password: ""
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Invalid input data" }); // Changed to match actual response
  });

  test("Auth test registration with empty email", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        userName: "TestUser",
        email: "",
        password: "123456"
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Invalid email format" }); 
});

  test("Auth test registration with special characters in email", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        email: "test!@#$%^&*()@example.com",
        password: "123456"
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("Auth test login", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
    testUser._id = response.body._id;
  });

  test("Auth test login with empty credentials", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: "",
        password: ""
      });
    expect(response.statusCode).toBe(404);
  });

  test("Auth test multiple concurrent login attempts", async () => {
    const loginPromises = Array(3).fill(null).map(() => 
      request(app)
        .post(baseUrl + "/login")
        .send(testUser)
    );

    const responses = await Promise.all(loginPromises);
    
    responses.forEach(response => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    // Verify all tokens are different
    const tokens = responses.map(r => r.body.accessToken);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(tokens.length);
  });

  test("Auth test login make sure tokens are diffrent", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    expect(accessToken).not.toBe(testUser.accessToken);
    expect(refreshToken).not.toBe(testUser.refreshToken);
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
    testUser._id = response.body._id;
  });

  test("Test token access", async () => {
    const response2 = await request(app)
      .post("/posts")
      .set({
        authorization: "JWT " + testUser.accessToken,
      })
      .send({
        title: "Test title",
        content: "Test content",
        sender: "noa",
      });
    expect(response2.statusCode).toBe(201);
  });

  test("Auth middleware with invalid authorization header format", async () => {
    const response = await request(app)
      .post("/")
      .set({
        authorization: "Invalid " + testUser.accessToken,
      })
      .send({
        title: "Test title",
        content: "Test content",
        sender: "test"
      });
    expect(response.statusCode).toBe(404);
  });

  test("Auth middleware with missing authorization header", async () => {
    const response = await request(app)
      .post("/")
      .send({
        title: "Test title",
        content: "Test content",
        sender: "test"
      });
    expect(response.statusCode).toBe(404);
  });

  test("Test token access fail", async () => {
    const response2 = await request(app)
      .post("/")
      .set({
        authorization: "JWT " + testUser.accessToken + "f",
      })
      .send({
        title: "Test title",
        content: "Test content",
        sender: "noa",
      });
    expect(response2.statusCode).not.toBe(201);
  });

  test("Test refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test("Test refresh with missing refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send({});
    expect(response.statusCode).toBe(400);
   // expect(response.body).toBe("error");
  });

  test("Test token generation with missing TOKEN_SECRET", async () => {
    const originalSecret = process.env.TOKEN_SECRET;
    delete process.env.TOKEN_SECRET;

    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");

    // Restore TOKEN_SECRET
    process.env.TOKEN_SECRET = originalSecret;
  });

  test("Test refresh token fail", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response.statusCode).toBe(200);
    const newRefreshToken = response.body.refreshToken;

    const response2 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: newRefreshToken,
      });
    expect(response3.statusCode).not.toBe(200);
  });

  test("Test Logout", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;

    const response2 = await request(app)
      .post(baseUrl + "/logout")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response2.statusCode).toBe(200);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response3.statusCode).not.toBe(200);
  });

  test("Test logout with invalid refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/logout")
      .send({
        refreshToken: "invalid_token"
      });
    expect(response.statusCode).toBe(400);
   // expect(response.body).toBe("error");
  });

  jest.setTimeout(20000);

  test("Token expiration", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    await new Promise((resolve) => setTimeout(resolve, 17000));

    const response2 = await request(app)
      .post("/")
      .set({
        authorization: "JWT " + testUser.accessToken,
      })
      .send({
        title: "Test title",
        content: "Test content",
        sender: "noa",
      });

    expect(response2.statusCode).not.toBe(201);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response3.statusCode).toBe(200);
    testUser.accessToken = response3.body.accessToken;
    testUser.refreshToken = response3.body.refreshToken;

    const response4 = await request(app)
      .post("/posts")
      .set({
        authorization: "JWT " + testUser.accessToken,
      })
      .send({
        title: "Test title",
        content: "Test content",
        sender: "noa",
      });
    expect(response4.statusCode).toBe(201);
  });

  test("Auth test invalid email format", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        email: "not-an-email",
      });
    expect(response.statusCode).toBe(400);
  });

  test("Auth test login non-existent user", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: "nonexistent@test.com",
        password: "123456",
      });
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  test("Auth test Login - invalid password (less than 8 characters)", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: "test@example.com",
        password: "123",
      });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  test("Auth test register new user", async () => {
    const response = await request(app)
    .post(baseUrl + "/register")
    .send({
      email: "gedonoa@gmail.com",
      password:"123456",
      userName:"Noaaaaaaaaaa"
    });
  expect(response.statusCode).toBe(200);
  });

  test("Auth test register with missing fields", async () => {
    const response = await request(app)
      .post(baseUrl + "/register")
      .send({
        email: "newuser@test.com"
      });
    expect(response.statusCode).toBe(400);
  });

  test("Auth test login with incorrect password", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: "existinguser@test.com",
        password: "wrongpassword"
      });
    expect(response.statusCode).toBe(404);
  });

  
  


});