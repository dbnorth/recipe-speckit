# API Reference

**Status:** current on `dev` after Features 1–5.

API mount path is `/recipeapi` (see `backend/server.js`).

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Session token is an encrypted session id (not a JWT). `SECRET_KEY` is required in the environment.
- Authenticated product writes: `Authorization: Bearer <token>`.
- Login uses HTTP Basic (`email:password`) on `POST /recipeapi/login`.

### Auth failures (protected routes)

| Condition | Status | Message |
|-----------|--------|---------|
| Missing `Authorization` header | `401` | `Unauthorized! No Auth Header` |
| Expired or invalid Bearer token | `401` | `Unauthorized! Expired Token, Logout and Login again` |

### Session create shape (register or login)

```json
{ "id": 1, "email": "jane@example.com", "firstName": "Jane", "lastName": "Doe", "token": "<encrypted-session-id>" }
```

---

## Users & sessions

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `POST` | `/recipeapi/users/` | No | Register + create session | Feature 1 |
| `POST` | `/recipeapi/login` | Basic | Sign in + create session | Feature 1 |
| `POST` | `/recipeapi/logout` | Bearer | Destroy session | Feature 1 |

**Register body:**

```json
{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "password": "secret" }
```

**Register validation (400):** `First name cannot be empty for user!` (same pattern for last name, email, password). Duplicate email → `400` `This email is already in use.`

**Login errors (401):** unknown email → `User not found!`; wrong password → `Invalid password!`

**Logout success:** `{ "message": "Logged out successfully." }`  
**Logout without Bearer (as-built):** `401` `{ "message": "Authentication required" }`

Admin-style `GET/PUT/DELETE /recipeapi/users…` exist in code and are unused by the SPA (Feature 1 Out of Scope).

---

## Recipes

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `GET` | `/recipeapi/recipes/` | No | Published recipes (`isPublished` true), name ASC | Feature 2 |
| `GET` | `/recipeapi/recipes/user/:userId` | Bearer | That user’s recipes (including drafts), name ASC | Feature 2 |
| `GET` | `/recipeapi/recipes/:id` | No | One recipe as an **array** (as-built `findAll`), with nested steps/ingredients when present | Feature 2 |
| `POST` | `/recipeapi/recipes/` | Bearer | Create | Feature 2 |
| `PUT` | `/recipeapi/recipes/:id` | Bearer | Update header; not found or not owned → `404` | Feature 4 |

**Create body:**

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

**Create validation (400):** `Name cannot be empty for recipe!` (same pattern for description, servings, time, isPublished, userId).

**Update success:** `{ "message": "Recipe was updated successfully." }`  
**Update not found / not owner:** `404` `{ "message": "Cannot find Recipe with id={id}." }`

`DELETE /recipeapi/recipes/` (delete all) exists in code and is unused by the SPA (Feature 2 Out of Scope).

---

## Ingredients (shared catalog)

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `GET` | `/recipeapi/ingredients/` | No | Catalog, name ASC | Feature 3 |
| `GET` | `/recipeapi/ingredients/:id` | No | One ingredient | Feature 3 |
| `POST` | `/recipeapi/ingredients/` | Bearer | Create | Feature 3 |
| `PUT` | `/recipeapi/ingredients/:id` | Bearer | Update | Feature 3 |

**Create body:**

```json
{ "name": "Flour", "unit": "cup", "pricePerUnit": 0.25 }
```

**Create validation (400):** `Name cannot be empty for ingredient!` (same pattern for unit and price per unit).

`DELETE` ingredient routes exist in code and are unused by the SPA (Feature 3 Out of Scope).

---

## Recipe ingredients

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients/` | No | Lines for a recipe (includes catalog `ingredient`) | Feature 4 |
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients/` | Bearer | Add line; recipe missing or not owned → `404` | Feature 4 |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Bearer | Update line (quantity / `recipeStepId`) | Feature 4 |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id` | Bearer | Delete line | Feature 4 |

**Create body:**

```json
{ "quantity": 2, "recipeId": 1, "ingredientId": 5, "recipeStepId": null }
```

**Create 404:** `{ "message": "Cannot find Recipe with id={recipeId}." }`

---

## Recipe steps

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `GET` | `/recipeapi/recipes/:recipeId/recipeSteps/` | No | Steps, `stepNumber` ASC | Feature 4 |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients/` | No | Steps + recipe ingredients + catalog ingredient | Feature 4 |
| `POST` | `/recipeapi/recipes/:recipeId/recipeSteps/` | Bearer | Add step | Feature 4 |
| `PUT` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Bearer | Update step | Feature 4 |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeSteps/:id` | Bearer | Delete step | Feature 4 |

**Create body:**

```json
{ "stepNumber": 1, "instruction": "Mix dry ingredients.", "recipeId": 1 }
```

**Create validation (400):** missing `stepNumber` / `instruction` / `recipeId` → `{ "message": "…" }` (instruction: `Description cannot be empty for recipe step!`).

---

## Export

No export HTTP endpoint. PDF generation is client-side (Feature 5) and reads:

- `GET /recipeapi/recipes/:recipeId/recipeIngredients/`
- `GET /recipeapi/recipes/:recipeId/recipeStepsWithIngredients/`
