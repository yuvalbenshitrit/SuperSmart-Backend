import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import { URL } from "url";
import path from "path";

let app: Express;

beforeAll(async () => {
    const { app: initedApp } = await initApp();
    app = initedApp;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("File Tests", () => {
    test("upload file", async () => {
        const filePath = path.join(__dirname, "test_file.txt");

        try {
            const response = await request(app)
                .post("/file?file=test_file.txt")
                .attach("file", filePath);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("url");

            const rawUrl = response.body.url.replace(/\\/g, "/");
            const parsedUrl = new URL(rawUrl, "http://localhost:3000");
            const pathname = parsedUrl.pathname;

            
            expect(pathname).toMatch(/^\/public\/\d+\.txt$/);

           
            const fileResponse = await request(app).get(pathname);
            expect(fileResponse.statusCode).toBe(200);

        } catch (err) {
            console.error("❌ Error during file test:", err);
            expect(1).toBe(2); 
        }
    });
});
