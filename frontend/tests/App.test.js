/**
 * Harness — Vue app shell
 * Verifies the test setup can mount App.vue with Vuetify.
 */
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import App from "../src/App.vue";

const vuetify = createVuetify({ components, directives });
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/", component: { template: "<div />" } }],
});

describe("Harness", () => {
  it("mounts the app shell", async () => {
    await router.push("/");
    await router.isReady();
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify, router],
        stubs: {
          MenuBar: { template: "<nav>Recipes</nav>" },
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.html().length).toBeGreaterThan(0);
    expect(wrapper.html()).toMatch(/v-application|v-app|v-main/);
  });
});
