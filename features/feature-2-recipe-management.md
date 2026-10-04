# Feature: Recipe Management

**Feature ID:** 2
**Branch pattern:** `feature/2-recipe-management`
**Status:** Shipped
**Created:** 2026-10-04
**Input:** Guests browse published recipes; signed-in users create and list their own recipes.
**Depends on:** [Feature 1 — User Authentication & Session Management](feature-1-user-authentication-session-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-2.1: View published recipes
**As a** visitor
**I want to** see recipes that authors have published
**So that** I can cook from the shared collection without an account

**Priority:** P1
**Independent test:** From Login, click View Published Recipes and see only recipes with `isPublished` true.
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: View my recipes
**As a** signed-in user
**I want to** see the recipes I created
**So that** I can manage my own collection including drafts

**Priority:** P1
**Independent test:** Sign in; Recipes shows that user’s recipes (published and unpublished), not only the public list.
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: Create a recipe
**As a** signed-in user
**I want to** add a recipe with name, description, servings, time, and publish flag
**So that** it appears in my list

**Priority:** P1
**Independent test:** Use Add → Add Recipe; the new recipe is owned by me and listed on Recipes.
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Expand a recipe card
**As a** visitor or signed-in user
**I want to** expand a recipe card
**So that** I can read its description, ingredients, and steps

**Priority:** P1
**Independent test:** Click a recipe card; ingredients and steps sections appear.
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: Open recipe editor
**As a** signed-in user
**I want to** open a recipe for editing
**So that** I can change its details and composition (Feature 4)

**Priority:** P1
**Independent test:** Pencil on a card navigates to Edit Recipe for that id.
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Guests MUST retrieve published recipes via `GET /recipeapi/recipes/` (`isPublished` true), ordered by name.
- **FR-002**: Signed-in users MUST retrieve their recipes via `GET /recipeapi/recipes/user/:userId` (auth required), ordered by name, including unpublished.
- **FR-003**: A recipe MUST have name, description, servings (integer), time in minutes (integer), `isPublished` (boolean), and `userId` (owner).
- **FR-004**: Creating a recipe MUST require a valid session. Missing required fields → `400` with the matching “cannot be empty for recipe” message.
- **FR-005**: New recipes MUST be owned by the creating user (`userId`).
- **FR-006**: `GET /recipeapi/recipes/:id` MUST return that recipe (with steps and nested ingredients when present). No auth required for read.
- **FR-007**: The Recipes screen MUST show **Add** only when signed in.
- **FR-008**: Recipe cards MUST show name, servings chip, time chip, and description; click toggles details (Ingredients and Recipe Steps).
- **FR-009**: Signed-in users MUST see a pencil that navigates to `editRecipe` (`/recipe/:id`).

---

## Assumptions

- Feature 1 session and MenuBar are on `dev`.
- Steps and recipe-ingredient *writes* are Feature 4; cards may *read* them for display.
- PDF icon is Feature 5.

---

## Edge Cases

- Empty published list → empty Recipes (no cards)
- Guest hitting `GET /recipeapi/recipes/user/:userId` without token → `401`
- Create without name/description/servings/time/isPublished/userId → `400`

---

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test
- **SC-002**: A guest never sees another user’s unpublished recipe on the published list
- **SC-003**: After create, the owner sees the recipe on Recipes without signing out

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Read published** | Any caller may list `isPublished = true` |
| **Read mine** | `GET …/recipes/user/:userId` requires a session (as-built; UI uses the signed-in user’s id) |
| **Create** | Recipe `userId` is the creating user |
| **Cross-user write** | Update ownership is Feature 4 (`404` if not owner) |
| **UI** | Guests see published list; signed-in users see their list |

---

## Key Entities

- **Recipe**: named dish with description, servings, time, publish flag, owned by one User
- **User**: owner (Feature 1)

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes/` | No | Published recipes |
| `GET` | `/recipeapi/recipes/user/:userId` | Bearer | That user’s recipes |
| `GET` | `/recipeapi/recipes/:id` | No | One recipe (array of one, with nested steps) |
| `POST` | `/recipeapi/recipes/` | Bearer | Create |

**Create request body:**
```json
{
  "name": "Pancakes",
  "description": "Weekend breakfast",
  "servings": 4,
  "time": 20,
  "isPublished": false,
  "userId": 1
}
```

**Success create:** recipe row including `id`.  
**Error:** `{ "message": "…" }`  
`DELETE /recipeapi/recipes/` (delete all) is Out of Scope.

---

## Screen Requirements

### [View: Recipe List] — route name `recipes` (`/recipes`)
*   Heading **Recipes**
*   Primary action when signed in: **Add**
*   Add Recipe dialog: **Name**, **Number of Servings**, **Time to Make (in minutes)**, **Description**, **Publish? Yes/No**; **Close**, **Add Recipe**
*   Success snackbar: `{name} added successfully!`
*   Cards: `RecipeCardComponent` — name, servings, minutes, description; expand for **Ingredients** and **Recipe Steps**
*   Signed-in: pencil → Edit Recipe

### [View: Login]
*   **View Published Recipes** navigates here (Feature 1 chrome)

---

## Data Model Requirements

### recipes

| Field | Type | Rules |
|-------|------|--------|
| id | integer | PK |
| name | string | required |
| description | string | required |
| servings | integer | required |
| time | integer | required (minutes) |
| isPublished | boolean | required |
| userId | integer | FK → users, required |

**Associations:** User hasMany Recipe; Recipe belongsTo User.  
Steps / recipeIngredients associations are Feature 4.

---

## Acceptance Criteria (Gherkin)

### US-2.1 — View published recipes

#### Scenario: Guest views published recipes
* **Given** at least one published recipe exists
* **When** I open Recipes without signing in
* **Then** I see that published recipe’s name
* **And** I do not see an unpublished recipe

#### Scenario: Guest opens published recipes from Login
* **Given** I am on Login
* **When** I click View Published Recipes
* **Then** I am on Recipes

### US-2.2 — View my recipes

#### Scenario: Signed-in user sees their own recipes including drafts
* **Given** I am signed in and I have an unpublished recipe
* **When** I open Recipes
* **Then** I see that unpublished recipe

### US-2.3 — Create a recipe

#### Scenario: User creates a recipe
* **Given** I am signed in on Recipes
* **When** I click Add, fill Name, servings, time, and description, and click Add Recipe
* **Then** I see `{name} added successfully!`
* **And** the recipe appears in my list

#### Scenario: User creates a recipe with a missing name
* **Given** I am signed in
* **When** I `POST /recipeapi/recipes/` without `name`
* **Then** the response is `400` that name cannot be empty for recipe

#### Scenario: Guest cannot create a recipe
* **Given** I am not signed in
* **When** I view Recipes
* **Then** I do not see Add

### US-2.4 — Expand a recipe card

#### Scenario: User expands a recipe card
* **Given** a recipe is shown on Recipes
* **When** I click the card
* **Then** I see Ingredients and Recipe Steps

### US-2.5 — Open recipe editor

#### Scenario: Signed-in user opens Edit Recipe
* **Given** I am signed in and a recipe card is visible
* **When** I click the pencil
* **Then** I am on Edit Recipe for that recipe

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-2.1 | Guest views published recipes | `backend/tests/recipes.test.js` | `Guest views published recipes` |
| US-2.1 | Guest opens published recipes from Login | `frontend/tests/Login.test.js` | `Guest opens published recipes from Login` |
| US-2.2 | Signed-in user sees their own recipes including drafts | `backend/tests/recipes.test.js` | `Signed-in user sees their own recipes including drafts` |
| US-2.3 | User creates a recipe | `backend/tests/recipes.test.js` | `User creates a recipe` |
| US-2.3 | User creates a recipe with a missing name | `backend/tests/recipes.test.js` | `User creates a recipe with a missing name` |
| US-2.3 | Guest cannot create a recipe | `frontend/tests/RecipeList.test.js` | `Guest cannot create a recipe` |
| US-2.4 | User expands a recipe card | `frontend/tests/RecipeCard.test.js` | `User expands a recipe card` |
| US-2.5 | Signed-in user opens Edit Recipe | `frontend/tests/RecipeCard.test.js` | `Signed-in user opens Edit Recipe` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-recipe-management.md on branch `feature/2-recipe-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `api.md`, `data-model.md`, `behavior.md`

---

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [x] **Success Criteria (SC-00N)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated (if schema changed)
*   [x] `features/reference/api.md` updated (if API changed)
*   [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Add/edit/delete steps and recipe-line ingredients — [Feature 4](feature-4-recipe-composition.md)
- Update recipe metadata on Edit Recipe — [Feature 4](feature-4-recipe-composition.md)
- Ingredient catalog — [Feature 3](feature-3-ingredient-catalog-management.md)
- PDF download — [Feature 5](feature-5-recipe-export.md)
- Delete-all recipes endpoint
