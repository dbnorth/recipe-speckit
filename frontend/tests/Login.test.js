/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import MenuBar from "../src/components/MenuBar.vue";

const vuetify = createVuetify({ components, directives });

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "login", component: { template: "<div>Login</div>" } },
      {
        path: "/recipes",
        name: "recipes",
        component: { template: "<div>Recipes</div>" },
      },
      {
        path: "/ingredients",
        name: "ingredients",
        component: { template: "<div>Ingredients</div>" },
      },
    ],
  });
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("User remains signed in after refresh", async () => {
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
      const wrapper = mount(
        { template: "<v-app><MenuBar /></v-app>", components: { MenuBar } },
        { global: { plugins: [vuetify, router] } }
      );
      await flushPromises();
      expect(wrapper.text()).toContain("Ingredients");
      const loginButtons = wrapper
        .findAll("a, button")
        .filter((node) => node.text().trim() === "Login");
      expect(loginButtons.length).toBe(0);
    });
  });
});
