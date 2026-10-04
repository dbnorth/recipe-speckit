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

async function addStep(token, recipeId, body) {
  return request(app)
    .post(`/recipeapi/recipes/${recipeId}/recipeSteps/`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("Feature 4 — Recipe Composition", () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });

  describe("US-4.3 — Manage recipe steps", () => {
    it("Owner adds a recipe step", async () => {
      const user = await registerUser();
      const recipe = await createRecipe(user.token, user.id);
      const instruction = "Mix dry ingredients.";

      const res = await addStep(user.token, recipe.id, {
        stepNumber: 1,
        instruction,
        recipeId: recipe.id,
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.stepNumber).toBe(1);
      expect(res.body.instruction).toBe(instruction);

      const list = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeSteps/`
      );
      expect(list.status).toBe(200);
      const row = list.body.find((item) => item.id === res.body.id);
      expect(row).toBeDefined();
      expect(row.instruction).toBe(instruction);
    });

    it("Owner deletes a recipe step", async () => {
      const user = await registerUser();
      const recipe = await createRecipe(user.token, user.id);
      const created = await addStep(user.token, recipe.id, {
        stepNumber: 1,
        instruction: "Preheat the oven.",
        recipeId: recipe.id,
      });
      expect(created.status).toBe(200);

      const deleted = await request(app)
        .delete(`/recipeapi/recipes/${recipe.id}/recipeSteps/${created.body.id}`)
        .set("Authorization", `Bearer ${user.token}`);
      expect(deleted.status).toBe(200);
      expect(deleted.body.message).toMatch(/deleted successfully/i);

      const list = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeSteps/`
      );
      expect(list.body.map((item) => item.id)).not.toContain(created.body.id);
    });

    it("User adds a step with a missing instruction", async () => {
      const user = await registerUser();
      const recipe = await createRecipe(user.token, user.id);
      const res = await addStep(user.token, recipe.id, {
        stepNumber: 1,
        recipeId: recipe.id,
      });
      expect(res.status).toBe(400);
    });
  });

  describe("US-4.4 — Attach ingredients to a step", () => {
    it("Owner attaches a recipe ingredient to a step", async () => {
      const user = await registerUser();
      const recipe = await createRecipe(user.token, user.id);
      const flourName = unique("Flour");
      const flour = await request(app)
        .post("/recipeapi/ingredients/")
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          name: flourName,
          unit: "cup",
          pricePerUnit: 0.25,
        });
      expect(flour.status).toBe(200);

      const line = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          quantity: 2,
          recipeId: recipe.id,
          ingredientId: flour.body.id,
          recipeStepId: null,
        });
      expect(line.status).toBe(200);

      const step = await addStep(user.token, recipe.id, {
        stepNumber: 1,
        instruction: "Mix dry ingredients.",
        recipeId: recipe.id,
      });
      expect(step.status).toBe(200);

      const attached = await request(app)
        .put(
          `/recipeapi/recipes/${recipe.id}/recipeIngredients/${line.body.id}`
        )
        .set("Authorization", `Bearer ${user.token}`)
        .send({ recipeStepId: step.body.id });
      expect(attached.status).toBe(200);

      const withIngredients = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeStepsWithIngredients/`
      );
      expect(withIngredients.status).toBe(200);
      const row = withIngredients.body.find((item) => item.id === step.body.id);
      expect(row).toBeDefined();
      const linked = (row.recipeIngredient || []).find(
        (item) => item.id === line.body.id
      );
      expect(linked).toBeDefined();
      expect(linked.ingredient).toBeDefined();
      expect(linked.ingredient.name).toBe(flourName);
    });
  });
});
