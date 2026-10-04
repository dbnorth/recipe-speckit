# Behavior & Rules Reference

**Status:** current on `dev` after Features 1–5.

Product rules only — Gherkin stays in `features/feature-N-*.md`.

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Register requires first name, last name, email, password | Controller `400` with “cannot be empty for user” | Feature 1 |
| Email must be unique at register | Controller `400` `This email is already in use.` | Feature 1 |
| Passwords stored hashed with per-user salt | `hashPassword` + `salt` blob; never returned as a usable secret | Feature 1 |
| Register and login create a session expiring in one day | `Session.create` with `expirationDate` = now + 1 day; token = encrypted session id | Feature 1 |
| Invalid login email | `401` `User not found!` | Feature 1 |
| Invalid login password | `401` `Invalid password!` | Feature 1 |
| SPA stores session as `localStorage` key `user` | Login/register payload; axios attaches `Authorization: Bearer <token>` | Feature 1 |
| Login page starts as guest | Clears `localStorage` `user` on mount | Feature 1 |
| Logout destroys the session and clears the SPA | `POST /recipeapi/logout`; UI clears `user` and routes to Login | Feature 1 |
| Protected writes require a live session | `authenticateRoute`; missing header `401` `Unauthorized! No Auth Header`; expired/invalid `401` `Unauthorized! Expired Token, Logout and Login again` | Feature 1 |
| MenuBar chrome | Signed out: **Login**. Signed in: **Ingredients** + user menu **Logout**. Title **Recipes** | Feature 1 |
| Published list is public and drafts stay private | `GET /recipeapi/recipes/` filters `isPublished = true`, ordered by name | Feature 2 |
| Owner list includes drafts | `GET /recipeapi/recipes/user/:userId` (Bearer), ordered by name | Feature 2 |
| Recipe create requires session + all header fields | Bearer; `400` “cannot be empty for recipe” | Feature 2 |
| Recipe is owned by `userId` | Set on create; later writes check owner | Feature 2 |
| Recipes **Add** is signed-in only | Hidden when `localStorage` `user` is null | Feature 2 |
| Pencil opens Edit Recipe | Signed-in card icon → `editRecipe` `/recipe/:id` | Feature 2 |
| Card expand shows ingredients and steps | Click toggles details; reads existing line/step APIs | Feature 2 |
| Ingredient catalog is shared | No `userId`; any signed-in user may create/update | Feature 3 |
| Catalog list is public | `GET /recipeapi/ingredients/` ordered by name | Feature 3 |
| Ingredient create requires name, unit, pricePerUnit | Bearer; `400` “cannot be empty for ingredient” | Feature 3 |
| Ingredients **Add** is signed-in only | Hidden when `localStorage` `user` is null | Feature 3 |
| Unit picker values | cup, gallon, gram, kilogram, liter, milliliter, ounce, pint, piece, pound, quart, tablespoon, teaspoon, unit | Feature 3 |
| Recipe update is owner-only | `PUT` finds recipe; missing or `userId ≠ req.user.id` → `404` `Cannot find Recipe with id={id}.` (never `403`) | Feature 4 |
| Recipe-ingredient create is owner-only | Recipe missing or not owned → `404` | Feature 4 |
| Cross-user writes return 404 | Not 403 — recipe header and line create | Feature 4 |
| Steps list in number order | `order: stepNumber ASC` | Feature 4 |
| Step create requires stepNumber, instruction, recipeId | `400` if missing | Feature 4 |
| Line may exist without a step | `recipeStepId` nullable | Feature 4 |
| Quantity display pluralizes unit | UI: `cup` / `cups` when quantity > 1 | Feature 4 |
| PDF icon is signed-in only | `mdi-file-pdf-box` when `localStorage` `user` is set; guests do not see it | Feature 5 |
| PDF is client-side | jsPDF; no export HTTP endpoint; click uses `@click.stop` so it does not open Edit Recipe | Feature 5 |
| PDF contents | Name, description, Ingredients (quantity, unit, name, price), Steps table, letter portrait, footer with name + “published as of” date | Feature 5 |
