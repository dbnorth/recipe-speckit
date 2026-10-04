/**
 * Feature 4 — Recipe Composition
 * Spec: features/feature-4-recipe-composition.md
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

async function createRecipe(token, userId) {
  const res = await request(app)
    .post("/recipeapi/recipes/")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: unique("Stew"),
      description: "For composition tests",
      servings: 4,
      time: 40,
      isPublished: false,
      userId,
    });
  expect(res.status).toBe(200);
  return res.body;
}

async function addCatalogIngredient(token, name) {
  const res = await request(app)
    .post("/recipeapi/ingredients/")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name,
      unit: "cup",
      pricePerUnit: 0.25,
    });
  expect(res.status).toBe(200);
  return res.body;
}

async function addRecipeIngredient(token, recipeId, ingredientId, quantity) {
  return request(app)
    .post(`/recipeapi/recipes/${recipeId}/recipeIngredients/`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      quantity,
      recipeId,
      ingredientId,
      recipeStepId: null,
    });
}

describe("Feature 4 — Recipe Composition", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });

  describe("US-4.2 — Manage recipe ingredients", () => {
    it("Owner adds a recipe ingredient", async () => {
      const user = await registerUser();
      const recipe = await createRecipe(user.token, user.id);
      const flourName = unique("Flour");
      const flour = await addCatalogIngredient(user.token, flourName);

      const res = await addRecipeIngredient(
        user.token,
        recipe.id,
        flour.id,
        2
      );
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(Number(res.body.quantity)).toBe(2);

      const list = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeIngredients/`
      );
      expect(list.status).toBe(200);
      const row = list.body.find((item) => item.id === res.body.id);
      expect(row).toBeDefined();
      expect(Number(row.quantity)).toBe(2);
      expect(row.ingredient).toBeDefined();
      expect(row.ingredient.name).toBe(flourName);
      expect(row.ingredient.unit).toBe("cup");
    });

    it("Owner deletes a recipe ingredient", async () => {
      const user = await registerUser();
      const recipe = await createRecipe(user.token, user.id);
      const flour = await addCatalogIngredient(user.token, unique("Flour"));
      const created = await addRecipeIngredient(
        user.token,
        recipe.id,
        flour.id,
        1
      );
      expect(created.status).toBe(200);

      const deleted = await request(app)
        .delete(
          `/recipeapi/recipes/${recipe.id}/recipeIngredients/${created.body.id}`
        )
        .set("Authorization", `Bearer ${user.token}`);
      expect(deleted.status).toBe(200);

      const list = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeIngredients/`
      );
      expect(list.body.map((item) => item.id)).not.toContain(created.body.id);
    });

    it("Owner cannot add an ingredient to someone else's recipe", async () => {
      const owner = await registerUser();
      const other = await registerUser();
      const recipe = await createRecipe(owner.token, owner.id);
      const flour = await addCatalogIngredient(other.token, unique("Flour"));

      const res = await addRecipeIngredient(
        other.token,
        recipe.id,
        flour.id,
        2
      );
      expect(res.status).toBe(404);
    });
  });
});
