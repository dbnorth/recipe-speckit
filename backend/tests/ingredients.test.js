/**
 * Feature 3 — Ingredient Catalog Management
 * Spec: features/feature-3-ingredient-catalog-management.md
 */
const request = require("supertest");
const app = require("../server");
const db = require("../app/models");

const password = "secret123";

function unique(label) {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function registerUser() {
  const res = await request(app).post("/recipeapi/users/").send({
    firstName: "Pat",
    lastName: "Baker",
    email: `${unique("cook")}@example.com`,
    password,
  });
  expect(res.status).toBe(200);
  return res.body;
}

async function addIngredient(token, body) {
  return request(app)
    .post("/recipeapi/ingredients/")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("Feature 3 — Ingredient Catalog Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });

  describe("US-3.1 — Browse the ingredient catalog", () => {
    it("User views the ingredient catalog", async () => {
      const user = await registerUser();
      const name = unique("Flour");
      const created = await addIngredient(user.token, {
        name,
        unit: "cup",
        pricePerUnit: 0.25,
      });
      expect(created.status).toBe(200);

      const res = await request(app).get("/recipeapi/ingredients/");
      expect(res.status).toBe(200);
      const row = res.body.find((item) => item.name === name);
      expect(row).toBeDefined();
      expect(row.unit).toBe("cup");
      expect(Number(row.pricePerUnit)).toBeCloseTo(0.25);
    });
  });

  describe("US-3.2 — Add an ingredient", () => {
    it("Signed-in user adds an ingredient", async () => {
      const user = await registerUser();
      const name = unique("Sugar");
      const res = await addIngredient(user.token, {
        name,
        unit: "cup",
        pricePerUnit: 0.5,
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe(name);

      const list = await request(app).get("/recipeapi/ingredients/");
      expect(list.body.map((item) => item.name)).toContain(name);
    });

    it("User adds an ingredient with a missing name", async () => {
      const user = await registerUser();
      const res = await addIngredient(user.token, {
        unit: "cup",
        pricePerUnit: 0.25,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name cannot be empty for ingredient/i);
    });
  });

  describe("US-3.3 — Edit an ingredient", () => {
    it("Signed-in user edits an ingredient", async () => {
      const user = await registerUser();
      const name = unique("Flour");
      const created = await addIngredient(user.token, {
        name,
        unit: "cup",
        pricePerUnit: 0.25,
      });
      expect(created.status).toBe(200);

      const updated = await request(app)
        .put(`/recipeapi/ingredients/${created.body.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ pricePerUnit: 0.4 });
      expect(updated.status).toBe(200);

      const list = await request(app).get("/recipeapi/ingredients/");
      const row = list.body.find((item) => item.id === created.body.id);
      expect(row).toBeDefined();
      expect(Number(row.pricePerUnit)).toBeCloseTo(0.4);
    });
  });
});
