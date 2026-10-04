/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
 */
const request = require("supertest");
const app = require("../server");
const db = require("../app/models");

const password = "secret123";

function unique(label) {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function registerUser() {
  const email = `${unique("cook")}@example.com`;
  const res = await request(app).post("/recipeapi/users/").send({
    firstName: "Pat",
    lastName: "Baker",
    email,
    password,
  });
  expect(res.status).toBe(200);
  return res.body;
}

async function createRecipe(token, body) {
  return request(app)
    .post("/recipeapi/recipes/")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("Feature 2 — Recipe Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });

  describe("US-2.1 — View published recipes", () => {
    it("Guest views published recipes", async () => {
      const user = await registerUser();
      const publishedName = unique("Published Chili");
      const draftName = unique("Secret Draft");
      const published = await createRecipe(user.token, {
        name: publishedName,
        description: "Public",
        servings: 4,
        time: 30,
        isPublished: true,
        userId: user.id,
      });
      expect(published.status).toBe(200);
      const draft = await createRecipe(user.token, {
        name: draftName,
        description: "Private",
        servings: 2,
        time: 15,
        isPublished: false,
        userId: user.id,
      });
      expect(draft.status).toBe(200);

      const res = await request(app).get("/recipeapi/recipes/");
      expect(res.status).toBe(200);
      const names = res.body.map((r) => r.name);
      expect(names).toContain(publishedName);
      expect(names).not.toContain(draftName);
    });
  });

  describe("US-2.2 — View my recipes", () => {
    it("Signed-in user sees their own recipes including drafts", async () => {
      const user = await registerUser();
      const draftName = unique("My Draft Stew");
      const created = await createRecipe(user.token, {
        name: draftName,
        description: "Not public",
        servings: 3,
        time: 45,
        isPublished: false,
        userId: user.id,
      });
      expect(created.status).toBe(200);

      const res = await request(app)
        .get(`/recipeapi/recipes/user/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`);
      expect(res.status).toBe(200);
      const names = res.body.map((r) => r.name);
      expect(names).toContain(draftName);
    });
  });

  describe("US-2.3 — Create a recipe", () => {
    it("User creates a recipe", async () => {
      const user = await registerUser();
      const name = unique("Pancakes");
      const res = await createRecipe(user.token, {
        name,
        description: "Weekend breakfast",
        servings: 4,
        time: 20,
        isPublished: false,
        userId: user.id,
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe(name);
      expect(res.body.userId).toBe(user.id);

      const list = await request(app)
        .get(`/recipeapi/recipes/user/${user.id}`)
        .set("Authorization", `Bearer ${user.token}`);
      expect(list.body.map((r) => r.name)).toContain(name);
    });

    it("User creates a recipe with a missing name", async () => {
      const user = await registerUser();
      const res = await createRecipe(user.token, {
        description: "No name",
        servings: 2,
        time: 10,
        isPublished: false,
        userId: user.id,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/name cannot be empty for recipe/i);
    });
  });
});

describe("Feature 4 — Recipe Composition", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });

  describe("US-4.1 — Update recipe details", () => {
    it("Owner updates recipe details", async () => {
      const user = await registerUser();
      const created = await createRecipe(user.token, {
        name: unique("Old Chili"),
        description: "Original",
        servings: 4,
        time: 30,
        isPublished: false,
        userId: user.id,
      });
      expect(created.status).toBe(200);

      const newName = unique("New Chili");
      const updated = await request(app)
        .put(`/recipeapi/recipes/${created.body.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({ name: newName });
      expect(updated.status).toBe(200);
      expect(updated.body.message).toBe("Recipe was updated successfully.");

      const get = await request(app).get(
        `/recipeapi/recipes/${created.body.id}`
      );
      expect(get.status).toBe(200);
      const row = Array.isArray(get.body)
        ? get.body.find((item) => item.id === created.body.id)
        : get.body;
      expect(row).toBeDefined();
      expect(row.name).toBe(newName);
    });

    it("Non-owner cannot update a recipe", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const created = await createRecipe(owner.token, {
        name: unique("Owner Only"),
        description: "Private",
        servings: 2,
        time: 15,
        isPublished: false,
        userId: owner.id,
      });
      expect(created.status).toBe(200);

      const res = await request(app)
        .put(`/recipeapi/recipes/${created.body.id}`)
        .set("Authorization", `Bearer ${other.token}`)
        .send({ name: unique("Hijacked") });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe(
        `Cannot find Recipe with id=${created.body.id}.`
      );
    });
  });
});
