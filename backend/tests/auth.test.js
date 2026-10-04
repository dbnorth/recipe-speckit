/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
const request = require("supertest");
const app = require("../server");
const db = require("../app/models");

const password = "secret123";

function uniqueEmail(label) {
  return `${label}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

function registerBody(overrides = {}) {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: uniqueEmail("jane"),
    password,
    ...overrides,
  };
}

async function register(overrides = {}) {
  const body = registerBody(overrides);
  const res = await request(app).post("/recipeapi/users/").send(body);
  return { body, res };
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.1 — Register an account", () => {
    it("User registers with valid details", async () => {
      const { res } = await register();
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.token.length).toBeGreaterThan(0);
      expect(res.body.email).toBeDefined();
      expect(res.body.firstName).toBe("Jane");
      expect(res.body.lastName).toBe("Doe");
    });

    it("User registers with an email that is already in use", async () => {
      const email = uniqueEmail("dup");
      const first = await register({ email });
      expect(first.res.status).toBe(200);
      const second = await register({ email });
      expect(second.res.status).toBe(400);
      expect(second.res.body.message).toBe("This email is already in use.");
    });

    it("User registers with a missing first name", async () => {
      const res = await request(app).post("/recipeapi/users/").send({
        lastName: "Doe",
        email: uniqueEmail("missing"),
        password,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/first name cannot be empty/i);
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      const { body, res: created } = await register();
      expect(created.status).toBe(200);
      const res = await request(app)
        .post("/recipeapi/login")
        .set(
          "Authorization",
          `Basic ${Buffer.from(`${body.email}:${body.password}`).toString("base64")}`
        );
      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.email).toBe(body.email);
      expect(res.body.id).toBe(created.body.id);
    });

    it("User signs in with an unknown email", async () => {
      const res = await request(app)
        .post("/recipeapi/login")
        .set(
          "Authorization",
          `Basic ${Buffer.from(`nobody.${Date.now()}@example.com:${password}`).toString("base64")}`
        );
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("User not found!");
    });

    it("User signs in with an invalid password", async () => {
      const { body, res: created } = await register();
      expect(created.status).toBe(200);
      const res = await request(app)
        .post("/recipeapi/login")
        .set(
          "Authorization",
          `Basic ${Buffer.from(`${body.email}:wrong-password`).toString("base64")}`
        );
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid password!");
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("Logout without a token is rejected", async () => {
      const res = await request(app).post("/recipeapi/logout");
      expect(res.status).toBe(401);
    });
  });

  describe("US-1.5 — Block unauthenticated writes", () => {
    it("Guest cannot create a recipe", async () => {
      const res = await request(app).post("/recipeapi/recipes/").send({
        name: "Pancakes",
        description: "Breakfast",
        servings: 4,
        time: 20,
        isPublished: false,
        userId: 1,
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Unauthorized! No Auth Header");
    });
  });
});
