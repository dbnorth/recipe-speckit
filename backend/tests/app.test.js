/**
 * Harness — Express app boot
 * Verifies the test setup can import the API and hit the welcome route.
 */
const request = require("supertest");
const app = require("../server");

describe("Harness", () => {
  it("GET / returns the welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Welcome to the recipe backend." });
  });
});
