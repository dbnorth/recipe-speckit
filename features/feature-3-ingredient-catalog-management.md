# Feature: Ingredient Catalog Management

**Feature ID:** 3
**Branch pattern:** `feature/3-ingredient-catalog-management`
**Status:** Shipped
**Created:** 2026-10-04
**Input:** A shared catalog of ingredients (name, unit, price) that recipes can reference.
**Depends on:** [Feature 1 — User Authentication & Session Management](feature-1-user-authentication-session-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-3.1: Browse the ingredient catalog
**As a** visitor or signed-in user
**I want to** see all ingredients
**So that** I know what can be used in recipes

**Priority:** P1
**Independent test:** Open Ingredients; table lists name, unit, and price per unit ordered by name.
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

### US-3.2: Add an ingredient
**As a** signed-in user
**I want to** add an ingredient with name, unit, and price per unit
**So that** recipes can use it

**Priority:** P1
**Independent test:** Add a new ingredient; it appears in the table.
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

### US-3.3: Edit an ingredient
**As a** signed-in user
**I want to** change an ingredient’s name, unit, or price
**So that** the catalog stays accurate

**Priority:** P1
**Independent test:** Pencil → Edit Ingredient → save; table shows the new values.
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Anyone MAY `GET /recipeapi/ingredients/` and receive ingredients ordered by name.
- **FR-002**: An ingredient MUST have `name`, `unit`, and `pricePerUnit`.
- **FR-003**: Create and update MUST require a session. Missing name/unit/pricePerUnit on create → `400`.
- **FR-004**: The Ingredients screen MUST show **Add** only when signed in.
- **FR-005**: Units offered in the UI MUST be: cup, gallon, gram, kilogram, liter, milliliter, ounce, pint, piece, pound, quart, tablespoon, teaspoon, unit.
- **FR-006**: The table MUST show Name, Unit, Price Per Unit (prefixed with `$`), and Actions (pencil).
- **FR-007**: Ingredients are a **shared catalog** (no per-user ownership column). Any signed-in user may add or edit.

---

## Assumptions

- Feature 1 MenuBar **Ingredients** link is available when signed in.
- Attaching catalog items to a recipe is Feature 4.

---

## Edge Cases

- Empty catalog → table with headers and no rows
- Guest can view the table if they navigate to `/ingredients` but cannot Add
- Delete-all ingredients endpoint is not in the UI

---

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test
- **SC-002**: After add, a refresh of Ingredients still shows the new row
- **SC-003**: Create without a token returns `401`

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Read** | Catalog is global; no `userId` filter |
| **Write** | Any authenticated user may create/update |
| **UI** | Add hidden when `localStorage` `user` is null |

This is a shared catalog, not per-user rows.

---

## Key Entities

- **Ingredient**: catalog item with name, unit, and price per unit

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/ingredients/` | No | List catalog |
| `GET` | `/recipeapi/ingredients/:id` | No | One ingredient |
| `POST` | `/recipeapi/ingredients/` | Bearer | Create |
| `PUT` | `/recipeapi/ingredients/:id` | Bearer | Update |

**Create request body:**
```json
{ "name": "Flour", "unit": "cup", "pricePerUnit": 0.25 }
```

**Error:** `{ "message": "…" }`  
`DELETE` ingredients (single or all) is Out of Scope for the SPA.

---

## Screen Requirements

### [View: Ingredient List] — route name `ingredients` (`/ingredients`)
*   Heading **Ingredients**
*   **Add** when signed in
*   Table columns: **Name**, **Unit**, **Price Per Unit**, **Actions**
*   Dialog title **Add Ingredient** or **Edit Ingredient**
*   Fields: **Name**, **Unit** (select), **Price Per Unit**
*   Actions: **Close**, **Add Ingredient** / **Update Ingredient**
*   Success: `{name} added successfully!` / update success snackbar

---

## Data Model Requirements

### ingredients

| Field | Type | Rules |
|-------|------|--------|
| id | integer | PK |
| name | string | required |
| unit | string | required |
| pricePerUnit | decimal(10,2) | required on create |

No user FK.

---

## Acceptance Criteria (Gherkin)

### US-3.1 — Browse the ingredient catalog

#### Scenario: User views the ingredient catalog
* **Given** an ingredient named Flour exists
* **When** I open Ingredients
* **Then** I see Flour, its unit, and its price per unit

### US-3.2 — Add an ingredient

#### Scenario: Signed-in user adds an ingredient
* **Given** I am signed in on Ingredients
* **When** I click Add, enter name, unit, and price, and save
* **Then** I see `{name} added successfully!`
* **And** the ingredient appears in the table

#### Scenario: User adds an ingredient with a missing name
* **Given** I am signed in
* **When** I `POST /recipeapi/ingredients/` without `name`
* **Then** the response is `400` that name cannot be empty for ingredient

#### Scenario: Guest cannot add an ingredient
* **Given** I am not signed in
* **When** I open Ingredients
* **Then** I do not see Add

### US-3.3 — Edit an ingredient

#### Scenario: Signed-in user edits an ingredient
* **Given** I am signed in and Flour is in the catalog
* **When** I click the pencil, change the price, and save
* **Then** the table shows the new price

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-3.1 | User views the ingredient catalog | `backend/tests/ingredients.test.js` | `User views the ingredient catalog` |
| US-3.2 | Signed-in user adds an ingredient | `backend/tests/ingredients.test.js` | `Signed-in user adds an ingredient` |
| US-3.2 | User adds an ingredient with a missing name | `backend/tests/ingredients.test.js` | `User adds an ingredient with a missing name` |
| US-3.2 | Guest cannot add an ingredient | `frontend/tests/IngredientList.test.js` | `Guest cannot add an ingredient` |
| US-3.3 | Signed-in user edits an ingredient | `backend/tests/ingredients.test.js` | `Signed-in user edits an ingredient` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 3 from @features/feature-3-ingredient-catalog-management.md on branch `feature/3-ingredient-catalog-management`.

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

- Linking ingredients to a recipe or step — [Feature 4](feature-4-recipe-composition.md)
- Per-user private ingredient lists
- Delete ingredient in the SPA
