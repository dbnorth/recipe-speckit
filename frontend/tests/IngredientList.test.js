/**
 * Feature 3 — Ingredient Catalog Management
 * Spec: features/feature-3-ingredient-catalog-management.md
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import IngredientList from "../src/views/IngredientList.vue";

vi.mock("../src/services/IngredientServices.js", () => ({
  default: {
    getIngredients: vi.fn(() => Promise.resolve({ data: [] })),
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
  },
}));

const vuetify = createVuetify({ components, directives });

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/ingredients",
        name: "ingredients",
        component: { template: "<div />" },
      },
    ],
  });
}

describe("Feature 3 — Ingredient Catalog Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-3.2 — Add an ingredient", () => {
    it("Guest cannot add an ingredient", async () => {
      const router = makeRouter();
      await router.push("/ingredients");
      await router.isReady();
      const wrapper = mount(
        {
          template: "<v-app><IngredientList /></v-app>",
          components: { IngredientList },
        },
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
