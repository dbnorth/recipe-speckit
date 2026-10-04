/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import MenuBar from "../src/components/MenuBar.vue";

vi.mock("../src/services/UserServices", () => ({
  default: {
    logoutUser: vi.fn(() =>
      Promise.resolve({ data: { message: "Logged out successfully." } })
    ),
  },
}));

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
    vi.clearAllMocks();
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
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
        {
          global: {
            plugins: [vuetify, router],
            stubs: {
              VMenu: {
                name: "VMenu",
                template:
                  "<div><slot name='activator' :props='{}' /><slot /></div>",
              },
            },
          },
        }
      );
      await flushPromises();

      const logoutBtn = wrapper
        .findAll("button")
        .find((btn) => btn.text().trim() === "Logout");
      expect(logoutBtn).toBeTruthy();
      await logoutBtn.trigger("click");
      await flushPromises();

      expect(localStorage.getItem("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
