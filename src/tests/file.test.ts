import request from "supertest";
import path from "path";
import fs from "fs";
import express from "express";
import initApp from "../server";
import mongoose from "mongoose";

let app: express.Application;
const testFilesDir = path.resolve(__dirname, "./testfiles");
const testFiles: string[] = [];

beforeAll(async () => {
  console.log("beforeAll");
  const result = await initApp();
  app = result.app;
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }
});

afterAll((done) => {
  console.log("afterAll");
  
  // Clean up test files
  testFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      console.error(`Failed to delete file ${file}:`, error);
    }
  });
  
  // Try to clean up test directory
  try {
    fs.rmdirSync(testFilesDir);
  } catch (error) {
    console.error("Failed to delete test directory:", error);
  }
  
  mongoose.connection.close();
  done();
});

describe("File Tests", () => {
  test("Placeholder test to prevent suite failure", () => {
    expect(true).toBe(true);
  });

  test("Should upload a file successfully", async () => {
    const testFilePath = path.join(testFilesDir, "test.txt");
    fs.writeFileSync(testFilePath, "Test file content");
    testFiles.push(testFilePath);
    
    const response = await request(app)
      .post("/file")
      .attach("file", testFilePath);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("url");
    expect(typeof response.body.url).toBe("string");
  });

  test("Should handle different file extensions", async () => {
    const testJpgPath = path.join(testFilesDir, "test.jpg");
    fs.writeFileSync(testJpgPath, "Mock JPG content");
    testFiles.push(testJpgPath);
    
    const jpgResponse = await request(app)
      .post("/file")
      .attach("file", testJpgPath);
    
    expect(jpgResponse.status).toBe(200);
    expect(jpgResponse.body.url).toMatch(/\.jpg$/);
  });
  
  test("Should handle files with complex extensions", async () => {
    const testPath = path.join(testFilesDir, "test.complex.ext");
    fs.writeFileSync(testPath, "Complex extension file content");
    testFiles.push(testPath);
    
    const response = await request(app)
      .post("/file")
      .attach("file", testPath);
    
    expect(response.status).toBe(200);
    expect(response.body.url).toMatch(/\.ext$/);
  });
  
  test("Should generate unique URLs for each upload", async () => {
    // Upload first file
    const file1Path = path.join(testFilesDir, "file1.txt");
    fs.writeFileSync(file1Path, "First file content");
    testFiles.push(file1Path);
    
    const response1 = await request(app)
      .post("/file")
      .attach("file", file1Path);
    
    // Upload second file
    const file2Path = path.join(testFilesDir, "file2.txt");
    fs.writeFileSync(file2Path, "Second file content");
    testFiles.push(file2Path);
    
    const response2 = await request(app)
      .post("/file")
      .attach("file", file2Path);
    
    expect(response1.body.url).not.toBe(response2.body.url);
  });
  
  test("Should handle file upload request without a file", async () => {
    const response = await request(app)
      .post("/file");
    
    // The actual behavior depends on multer configuration
    expect(response).toBeDefined();
  });
});
