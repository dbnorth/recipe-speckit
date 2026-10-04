# Feature: Recipe Composition

**Feature ID:** 4
**Branch pattern:** `feature/4-recipe-composition`
**Status:** Ready
**Created:** 2026-10-04
**Input:** Authors need to edit a recipe’s details, line ingredients, and numbered steps (optionally attaching catalog ingredients to a step).
**Depends on:** [Feature 2 — Recipe Management](feature-2-recipe-management.md), [Feature 3 — Ingredient Catalog Management](feature-3-ingredient-catalog-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-4.1: Update recipe details
**As a** recipe owner
**I want to** change name, description, servings, time, and publish flag
**So that** the listing stays accurate

**Priority:** P1
**Independent test:** On Edit Recipe, change fields and click Update Recipe; GET shows the new values. Another user gets `404` on PUT.
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Manage recipe ingredients
**As a** recipe owner
**I want to** add, edit, and remove catalog ingredients with a quantity on my recipe
**So that** the recipe has a shopping list

**Priority:** P1
**Independent test:** Add a line ingredient with quantity; it appears on Edit Recipe; delete removes it.
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Manage recipe steps
**As a** recipe owner
**I want to** add, edit, and delete numbered instructions
**So that** cooks can follow the method

**Priority:** P1
**Independent test:** Add a step with step number and instruction; it lists in order; delete removes it.
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Attach ingredients to a step
**As a** recipe owner
**I want to** associate existing recipe-line ingredients with a step
**So that** each step shows which ingredients it uses

**Priority:** P1
**Independent test:** Edit a step and attach a recipe ingredient; GET steps-with-ingredients includes that link.
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Owners MUST update their recipe via `PUT /recipeapi/recipes/:id`. Not found or not owned → `404` `{ "message": "Cannot find Recipe with id={id}." }`. Success message: `Recipe was updated successfully.`
- **FR-002**: Edit Recipe MUST load the recipe, its recipe-ingredients, catalog ingredients, and steps-with-ingredients.
- **FR-003**: A recipe ingredient MUST have `quantity`, `recipeId`, and `ingredientId`; optional `recipeStepId`.
- **FR-004**: Creating a recipe ingredient MUST require a session and MUST `404` if the recipe is missing or not owned by `req.user.id`.
- **FR-005**: A recipe step MUST have `stepNumber`, `instruction`, and `recipeId`. Missing fields → `400`.
- **FR-006**: Steps for a recipe MUST list in `stepNumber` ascending order.
- **FR-007**: `GET /recipeapi/recipes/:recipeId/recipeStepsWithIngredients/` MUST include each step’s recipe ingredients and catalog ingredient.
- **FR-008**: Edit Recipe UI: **Update Recipe**; Ingredients **Add**; Steps **Add**; pencil/trash on lines and steps.
- **FR-009**: Quantity display uses plural unit when quantity > 1 (`cup` / `cups`).

---

## Assumptions

- Recipe and catalog rows already exist (Features 2 and 3).
- Guests can still *read* published recipe details on cards (Feature 2); this feature is the editor.

---

## Edge Cases

- PUT recipe as a different user → `404` (not `403`)
- Create recipe-ingredient on someone else’s recipe → `404`
- Step instruction max length 5000 characters
- Recipe ingredient may exist with `recipeStepId` null (list-only, not tied to a step)

---

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test
- **SC-002**: Owner can add a step and a line ingredient and see both after reload
- **SC-003**: Non-owner cannot update the recipe (`404`)

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Recipe update** | Only `userId = req.user.id` |
| **Recipe-ingredient create** | Recipe must belong to `req.user.id` |
| **Cross-user** | `404`, never `403` |
| **Reads** | Step/ingredient GETs are unauthenticated (as-built) |
| **UI** | Editor is reached from a signed-in pencil (Feature 2) |

---

## Key Entities

- **Recipe**: header fields (Feature 2) updated here
- **RecipeStep**: numbered instruction on one recipe
- **RecipeIngredient**: quantity of one catalog Ingredient on a recipe, optionally on one step
- **Ingredient**: catalog item (Feature 3)

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `PUT` | `/recipeapi/recipes/:id` | Bearer | Update recipe header |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients/` | No | Lines for a recipe |
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients/` | Bearer | Add line |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Bearer | Update line |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Bearer | Delete line |
| `GET` | `/recipeapi/recipes/:recipeId/recipeSteps/` | No | Steps |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients/` | No | Steps + ingredients |
| `POST` | `/recipeapi/recipes/:recipeId/recipeSteps/` | Bearer | Add step |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Bearer | Update step |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Bearer | Delete step |

**Add step body:**
```json
{ "stepNumber": 1, "instruction": "Mix dry ingredients.", "recipeId": 1 }
```

**Add recipe ingredient body:**
```json
{ "quantity": 2, "recipeId": 1, "ingredientId": 5, "recipeStepId": null }
```

Delete-all step/ingredient endpoints are Out of Scope.

---

## Screen Requirements

### [View: Edit Recipe] — route name `editRecipe` (`/recipe/:id`)
*   Heading **Edit Recipe**
*   Header card: **Name**, **Number of Servings**, **Time to Make (in minutes)**, **Description**, **Publish? Yes/No**, **Update Recipe**
*   Success: `{name} updated successfully!`
*   Ingredients card + **Add**; list quantity, unit, name, price; pencil and trash
*   Dialogs for add/edit ingredient: quantity, catalog ingredient, optional step
*   Snackbars: `Ingredient added successfully!`, `{name} updated successfully!`, `{name} deleted successfully!`
*   Steps card + **Add**; table of number, instruction, actions
*   Snackbars: `Step added successfully!`, `Step updated successfully!`, `Step deleted successfully!`

---

## Data Model Requirements

### recipeSteps

| Field | Type | Rules |
|-------|------|--------|
| id | integer | PK |
| stepNumber | integer | required |
| instruction | string(5000) | required |
| recipeId | integer | FK → recipes |

### recipeIngredients

| Field | Type | Rules |
|-------|------|--------|
| id | integer | PK |
| quantity | float | required |
| recipeId | integer | FK → recipes |
| recipeStepId | integer | FK → recipeSteps, nullable |
| ingredientId | integer | FK → ingredients |

**Associations:** Recipe hasMany RecipeStep and RecipeIngredient; RecipeStep hasMany RecipeIngredient; RecipeIngredient belongsTo Recipe, RecipeStep, Ingredient.

---

## Acceptance Criteria (Gherkin)

### US-4.1 — Update recipe details

#### Scenario: Owner updates recipe details
* **Given** I own a recipe and I am on Edit Recipe
* **When** I change the name and click Update Recipe
* **Then** I see `{name} updated successfully!`
* **And** a later GET returns the new name

#### Scenario: Non-owner cannot update a recipe
* **Given** a recipe owned by another user
* **When** I `PUT /recipeapi/recipes/:id` as a different signed-in user
* **Then** the response is `404` `Cannot find Recipe with id={id}.`

### US-4.2 — Manage recipe ingredients

#### Scenario: Owner adds a recipe ingredient
* **Given** I own a recipe and Flour is in the catalog
* **When** I add quantity 2 of Flour
* **Then** I see `Ingredient added successfully!`
* **And** the list shows 2 cups (or the catalog unit) of Flour

#### Scenario: Owner deletes a recipe ingredient
* **Given** my recipe has a line ingredient
* **When** I click trash on that line
* **Then** I see a deleted-successfully snackbar
* **And** the line is gone

#### Scenario: Owner cannot add an ingredient to someone else's recipe
* **Given** a recipe I do not own
* **When** I `POST` a recipe ingredient for that recipe
* **Then** the response is `404`

### US-4.3 — Manage recipe steps

#### Scenario: Owner adds a recipe step
* **Given** I own a recipe
* **When** I add step number 1 with an instruction
* **Then** I see `Step added successfully!`
* **And** the step appears in the steps table

#### Scenario: Owner deletes a recipe step
* **Given** my recipe has a step
* **When** I delete that step
* **Then** I see `Step deleted successfully!`

#### Scenario: User adds a step with a missing instruction
* **Given** I am signed in
* **When** I `POST` a recipe step without `instruction`
* **Then** the response is `400`

### US-4.4 — Attach ingredients to a step

#### Scenario: Owner attaches a recipe ingredient to a step
* **Given** my recipe has a line ingredient and a step
* **When** I set that line’s step to the step and save
* **Then** `GET …/recipeStepsWithIngredients/` includes that ingredient on the step

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | Owner updates recipe details | `backend/tests/recipes.test.js` | `Owner updates recipe details` |
| US-4.1 | Non-owner cannot update a recipe | `backend/tests/recipes.test.js` | `Non-owner cannot update a recipe` |
| US-4.2 | Owner adds a recipe ingredient | `backend/tests/recipeIngredients.test.js` | `Owner adds a recipe ingredient` |
| US-4.2 | Owner deletes a recipe ingredient | `backend/tests/recipeIngredients.test.js` | `Owner deletes a recipe ingredient` |
| US-4.2 | Owner cannot add an ingredient to someone else's recipe | `backend/tests/recipeIngredients.test.js` | `Owner cannot add an ingredient to someone else's recipe` |
| US-4.3 | Owner adds a recipe step | `backend/tests/recipeSteps.test.js` | `Owner adds a recipe step` |
| US-4.3 | Owner deletes a recipe step | `backend/tests/recipeSteps.test.js` | `Owner deletes a recipe step` |
| US-4.3 | User adds a step with a missing instruction | `backend/tests/recipeSteps.test.js` | `User adds a step with a missing instruction` |
| US-4.4 | Owner attaches a recipe ingredient to a step | `backend/tests/recipeSteps.test.js` | `Owner attaches a recipe ingredient to a step` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-recipe-composition.md on branch `feature/4-recipe-composition`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `api.md`, `data-model.md`, `behavior.md`

---

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [ ] **Success Criteria (SC-00N)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Creating the recipe row — [Feature 2](feature-2-recipe-management.md)
- Creating catalog ingredients — [Feature 3](feature-3-ingredient-catalog-management.md)
- PDF export — [Feature 5](feature-5-recipe-export.md)
