# Feature: Recipe Export

**Feature ID:** 5
**Branch pattern:** `feature/5-recipe-export`
**Status:** Shipped
**Created:** 2026-10-04
**Input:** Signed-in users need a printable PDF of a recipe (ingredients, prices, and steps).
**Depends on:** [Feature 2 — Recipe Management](feature-2-recipe-management.md), [Feature 4 — Recipe Composition](feature-4-recipe-composition.md)
**Related:** `features/reference/behavior.md`

---

## User Stories

### US-5.1: Download a recipe PDF
**As a** signed-in user
**I want to** download a PDF of a recipe
**So that** I can print or share it offline

**Priority:** P1
**Independent test:** On a recipe card, click the PDF icon; a PDF is generated with the recipe name, description, ingredients, and steps.
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Signed-in users MUST see a PDF icon on recipe cards.
- **FR-002**: Guests MUST NOT see the PDF icon.
- **FR-003**: Generating the PDF MUST load that recipe’s ingredients and steps-with-ingredients (existing read APIs).
- **FR-004**: The PDF MUST include recipe name, description, an Ingredients section (quantity, unit, name, price per unit), and a Steps table (step number, instruction, ingredient names).
- **FR-005**: The PDF MUST be letter portrait and include a footer with the recipe name and a “published as of” date.
- **FR-006**: Export is client-side (jsPDF). No new export HTTP endpoint.

---

## Assumptions

- Recipe cards from Feature 2 are on `dev`.
- Ingredient and step data may be empty; the PDF still generates.

---

## Edge Cases

- Recipe with no ingredients or steps → PDF still has headings
- Clicking PDF must not navigate to Edit Recipe (`@click.stop`)

---

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test
- **SC-002**: A signed-in user can trigger PDF generation from a card without leaving Recipes
- **SC-003**: A guest does not see the PDF control

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **UI** | PDF icon only when `localStorage` `user` is set |
| **Data** | Uses public read APIs for that recipe’s lines and steps |
| **Writes** | None |

---

## Key Entities

- **Recipe**, **RecipeIngredient**, **RecipeStep** — read-only for export (defined in Features 2 and 4)

---

## API Requirements

No new endpoints. Uses:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients/` | No | Ingredient lines |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients/` | No | Steps for the table |

---

## Screen Requirements

### [View: Recipe List] — recipe card
*   PDF icon (`mdi-file-pdf-box`) when signed in
*   Click generates the PDF and does not open Edit Recipe
*   Pencil remains Feature 2 / 4 navigation

---

## Data Model Requirements

None. No new tables or columns.

---

## Acceptance Criteria (Gherkin)

### US-5.1 — Download a recipe PDF

#### Scenario: Signed-in user downloads a recipe PDF
* **Given** I am signed in and a recipe card is visible
* **When** I click the PDF icon
* **Then** a PDF is generated with the recipe name
* **And** I remain on Recipes

#### Scenario: Guest does not see the PDF icon
* **Given** I am not signed in
* **When** I view a recipe card
* **Then** I do not see the PDF icon

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | Signed-in user downloads a recipe PDF | `frontend/tests/RecipeCard.test.js` | `Signed-in user downloads a recipe PDF` |
| US-5.1 | Guest does not see the PDF icon | `frontend/tests/RecipeCard.test.js` | `Guest does not see the PDF icon` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-recipe-export.md on branch `feature/5-recipe-export`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `behavior.md` (export visibility rule)

---

## Definition of Done

*   [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
*   [x] **Success Criteria (SC-00N)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Server-side PDF generation or email
- Cost totals or scaled servings
- Export formats other than PDF
