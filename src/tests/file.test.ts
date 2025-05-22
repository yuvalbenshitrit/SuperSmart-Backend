import initApp from "../server";
import mongoose from "mongoose";

beforeAll(async () => {
  console.log("beforeAll");
  await initApp();
});

afterAll((done) => {
  console.log("afterAll");
  mongoose.connection.close();
  done();
});

describe("File Tests", () => {
  test("Placeholder test to prevent suite failure", () => {
    expect(true).toBe(true);
  });
});
