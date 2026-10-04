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
import RecipeList from "../src/views/RecipeList.vue";

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipes: vi.fn(() => Promise.resolve({ data: [] })),
    getRecipesByUserId: vi.fn(() => Promise.resolve({ data: [] })),
    addRecipe: vi.fn(),
  },
}));

vi.mock("../src/components/RecipeCardComponent.vue", () => ({
  default: { name: "RecipeCard", template: "<div />" },
}));

const vuetify = createVuetify({ components, directives });

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/recipes",
        name: "recipes",
        component: { template: "<div />" },
      },
    ],
  });
}

describe("Feature 2 — Recipe Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-2.3 — Create a recipe", () => {
    it("Guest cannot create a recipe", async () => {
      const router = makeRouter();
      await router.push("/recipes");
      await router.isReady();
      const wrapper = mount(
        { template: "<v-app><RecipeList /></v-app>", components: { RecipeList } },
        { global: { plugins: [vuetify, router] } }
      );
      await flushPromises();
      const addButtons = wrapper
        .findAll("button")
        .filter((btn) => btn.text().trim() === "Add");
      expect(addButtons.length).toBe(0);
    });
  });
});
