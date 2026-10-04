/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import RecipeCard from "../src/components/RecipeCardComponent.vue";
import RecipeReports from "../src/reports/RecipeReports.js";

vi.mock("../src/services/RecipeIngredientServices.js", () => ({
  default: {
    getRecipeIngredientsForRecipe: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("../src/services/RecipeStepServices", () => ({
  default: {
    getRecipeStepsForRecipeWithIngredients: vi.fn(() =>
      Promise.resolve({ data: [] })
    ),
  },
}));

vi.mock("../src/reports/RecipeReports.js", () => ({
  default: { generateRecipePDF: vi.fn() },
}));

const vuetify = createVuetify({ components, directives });

const recipe = {
  id: 42,
  name: "Test Pancakes",
  description: "Fluffy",
  servings: 4,
  time: 20,
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/recipes",
        name: "recipes",
        component: { template: "<div />" },
      },
      {
        path: "/recipe/:id",
        name: "editRecipe",
        component: { template: "<div>Edit</div>" },
      },
    ],
  });
}

async function mountCard(router, extras = {}) {
  const wrapper = mount(
    {
      template: "<v-app><RecipeCard :recipe='recipe' /></v-app>",
      components: { RecipeCard },
      data: () => ({ recipe }),
    },
    { global: { plugins: [vuetify, router], ...extras } }
  );
  await flushPromises();
  return wrapper;
}

describe("Feature 2 — Recipe Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-2.4 — Expand a recipe card", () => {
    it("User expands a recipe card", async () => {
      const router = makeRouter();
      await router.push("/recipes");
      await router.isReady();
      const wrapper = await mountCard(router);
      const card = wrapper.findComponent(RecipeCard);
      expect(card.text()).toContain("Test Pancakes");
      await card.trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Ingredients");
      expect(wrapper.text()).toContain("Recipe Steps");
    });
  });

  describe("US-2.5 — Open recipe editor", () => {
    it("Signed-in user opens Edit Recipe", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          token: "test-token",
        })
      );
      const router = makeRouter();
      await router.push("/recipes");
      await router.isReady();
      const wrapper = await mountCard(router);
      const pencil = wrapper.find(".mdi-pencil");
      expect(pencil.exists()).toBe(true);
      await pencil.trigger("click");
      await flushPromises();
      expect(router.currentRoute.value.name).toBe("editRecipe");
      expect(router.currentRoute.value.params.id).toBe("42");
    });
  });
});

describe("Feature 5 — Recipe Export", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-5.1 — Download a recipe PDF", () => {
    it("Signed-in user downloads a recipe PDF", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          token: "test-token",
        })
      );
      const router = makeRouter();
      await router.push("/recipes");
      await router.isReady();
      const wrapper = await mountCard(router);
      const pdf = wrapper.find(".mdi-file-pdf-box");
      expect(pdf.exists()).toBe(true);
      await pdf.trigger("click");
      await flushPromises();
      expect(RecipeReports.generateRecipePDF).toHaveBeenCalledWith(
        expect.objectContaining({ id: 42, name: "Test Pancakes" })
      );
      expect(router.currentRoute.value.name).toBe("recipes");
    });

    it("Guest does not see the PDF icon", async () => {
      const router = makeRouter();
      await router.push("/recipes");
      await router.isReady();
      const wrapper = await mountCard(router);
      expect(wrapper.find(".mdi-file-pdf-box").exists()).toBe(false);
    });
  });
});
