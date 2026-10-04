# Feature: User Authentication & Session Management

**Feature ID:** 1
**Branch pattern:** `feature/1-user-authentication-session-management`
**Status:** Shipped
**Created:** 2026-10-04
**Input:** People need accounts and sessions so they can create recipes and manage ingredients, while guests can still reach published recipes.
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-1.1: Register an account
**As a** visitor
**I want to** create an account with my name, email, and password
**So that** I can sign in and add my own recipes

**Priority:** P1
**Independent test:** Create an account via the Create Account dialog and land on Recipes with a stored session.
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: Sign in
**As a** registered user
**I want to** sign in with email and password
**So that** I can access my recipes and the ingredient catalog tools

**Priority:** P1
**Independent test:** Sign in with valid credentials and reach Recipes; invalid credentials stay on Login with an error.
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Stay signed in across page loads
**As a** signed-in user
**I want to** keep my session in the browser
**So that** I do not have to sign in again after a refresh

**Priority:** P1
**Independent test:** After login, reload Recipes and still see signed-in chrome (Add, Ingredients, Logout).
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Sign out
**As a** signed-in user
**I want to** sign out
**So that** this browser no longer uses my session

**Priority:** P1
**Independent test:** Logout from the MenuBar; session is cleared and Login is shown.
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

### US-1.5: Block unauthenticated writes
**As the** application
**I want to** reject create/update/delete API calls without a valid session
**So that** guests cannot change recipes or ingredients

**Priority:** P1
**Independent test:** Call a protected recipe or ingredient write without a Bearer token and receive `401`.
**Acceptance scenarios:** see ### US-1.5 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Visitors MUST be able to register with first name, last name, email, and password.
- **FR-002**: The system MUST reject registration when any of those fields is missing (`400`) or when the email is already in use (`400`, message `This email is already in use.`).
- **FR-003**: Passwords MUST be stored hashed with a per-user salt (never returned on later reads as a usable secret).
- **FR-004**: Successful registration MUST create a session (expiration one day later) and return `{ id, email, firstName, lastName, token }`.
- **FR-005**: Users MUST sign in with email and password via HTTP Basic on `POST /recipeapi/login`.
- **FR-006**: Invalid email MUST return `401` with `{ "message": "User not found!" }`. Invalid password MUST return `401` with `{ "message": "Invalid password!" }`.
- **FR-007**: Successful login MUST create a session and return the same user+token shape as registration.
- **FR-008**: The SPA MUST store the login/register payload in `localStorage` key `user` and attach `Authorization: Bearer <token>` on later API calls.
- **FR-009**: `POST /recipeapi/logout` with a valid Bearer token MUST destroy that session and return `{ "message": "Logged out successfully." }`. Missing/invalid token MUST return `401`.
- **FR-010**: The SPA MUST clear `localStorage` `user` on logout and send the user to Login.
- **FR-011**: Protected write routes MUST require `Authorization: Bearer <token>` for a non-expired session. Missing header → `401` `{ "message": "Unauthorized! No Auth Header" }`. Expired or invalid token → `401` `{ "message": "Unauthorized! Expired Token, Logout and Login again" }`.
- **FR-012**: Guests MUST still be able to open Login and follow **View Published Recipes** (published list is Feature 2).

---

## Assumptions

- API mount path is `/recipeapi`.
- Session tokens are encrypted session ids (not JWTs). `SECRET_KEY` is configured in the environment.
- There is no email-verification or password-reset flow in this feature.

---

## Edge Cases

- Duplicate email on register → `400` `This email is already in use.`
- Empty required register fields → `400` with the matching “cannot be empty” message
- Expired session on a protected route → `401`
- Login page currently clears `localStorage` `user` on mount (guest start)

---

## Success Criteria

- **SC-001**: Every Gherkin scenario in this file has at least one automated test before merge
- **SC-002**: A new user can register, see Recipes, refresh, and remain signed in
- **SC-003**: Wrong password never creates a session
- **SC-004**: After logout, protected writes return `401`

---

## Data Ownership & Isolation

| Rule | Requirement |
|------|-------------|
| **Account** | One User row per email |
| **Session** | Session belongs to that user; token identifies the session |
| **Writes** | Protected routes set `req.user.id` from the session |
| **Cross-user** | Another user’s resources are handled by later features (`404` when owned rows are required) |
| **UI** | MenuBar shows Login vs Ingredients + user menu from `localStorage` `user` |

---

## Key Entities

- **User**: person with first name, last name, email, and credentials
- **Session**: time-limited login for one user; encrypted id is the client token

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/recipeapi/users/` | No | Register |
| `POST` | `/recipeapi/login` | Basic (email:password) | Sign in |
| `POST` | `/recipeapi/logout` | Bearer | End session |

**Register request body:**
```json
{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "password": "secret" }
```

**Success (register or login):**
```json
{ "id": 1, "email": "jane@example.com", "firstName": "Jane", "lastName": "Doe", "token": "<encrypted-session-id>" }
```

**Error response:** `{ "message": "Human-readable explanation." }`

Admin-style `GET/PUT/DELETE /recipeapi/users…` exist in the codebase but are **not** product requirements of this feature (see Out of Scope).

---

## Screen Requirements

### [View: Login] — route name `login` (`/`)
*   Card title **Login**
*   Fields: **Email**, **Password**
*   Actions: **Create Account**, **Login**
*   Second card: **View Published Recipes** (navigates to `recipes`)
*   Create Account dialog: **First Name**, **Last Name**, **Email**, **Password**; **Close**, **Create Account**
*   Success snackbars: `Account created successfully!` / `Login successful!`
*   Error snackbar: API `message`
*   On mount: clear stored `user`

### App chrome
*   `MenuBar`: title **Recipes**; **Recipes** link; **Login** when signed out; **Ingredients** and user menu (**Logout**) when signed in

---

## Data Model Requirements

### users

| Field | Type | Rules |
|-------|------|--------|
| id | integer | PK, generated |
| firstName | string | required |
| lastName | string | required |
| email | string | required, unique in practice (enforced in controller) |
| password | blob | required, hashed |
| salt | blob | required |

### sessions

| Field | Type | Rules |
|-------|------|--------|
| id | integer | PK, generated |
| email | string | required |
| userId | integer | FK → users |
| expirationDate | datetime | required, login/register sets now + 1 day |

**Associations:** User hasMany Session; Session belongsTo User.

---

## Acceptance Criteria (Gherkin)

### US-1.1 — Register an account

#### Scenario: User registers with valid details
* **Given** I am on Login
* **When** I open Create Account and submit first name, last name, email, and password
* **Then** the API returns a user id and token
* **And** I see `Account created successfully!`
* **And** I am taken to Recipes

#### Scenario: User registers with an email that is already in use
* **Given** an account already exists for that email
* **When** I submit Create Account with the same email
* **Then** I see `This email is already in use.`
* **And** I stay on Login

#### Scenario: User registers with a missing first name
* **Given** I am creating an account
* **When** I submit without a first name
* **Then** the API responds `400` that first name cannot be empty

### US-1.2 — Sign in

#### Scenario: User signs in with valid credentials
* **Given** a registered user
* **When** I enter email and password and click Login
* **Then** I see `Login successful!`
* **And** I am taken to Recipes
* **And** `localStorage` `user` contains a token

#### Scenario: User signs in with an unknown email
* **Given** I am on Login
* **When** I submit credentials for an email that does not exist
* **Then** I see `User not found!`

#### Scenario: User signs in with an invalid password
* **Given** a registered user
* **When** I submit the correct email and a wrong password
* **Then** I see `Invalid password!`

### US-1.3 — Stay signed in across page loads

#### Scenario: User remains signed in after refresh
* **Given** I have signed in
* **When** I refresh Recipes
* **Then** MenuBar still shows Ingredients and the user menu

### US-1.4 — Sign out

#### Scenario: User signs out
* **Given** I am signed in
* **When** I choose Logout
* **Then** the session is destroyed
* **And** `localStorage` `user` is cleared
* **And** I am on Login

#### Scenario: Logout without a token is rejected
* **Given** no Bearer token
* **When** I `POST /recipeapi/logout`
* **Then** the response is `401`

### US-1.5 — Block unauthenticated writes

#### Scenario: Guest cannot create a recipe
* **Given** I am not signed in
* **When** I `POST /recipeapi/recipes/` without a Bearer token
* **Then** the response is `401` with `Unauthorized! No Auth Header`

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-1.1 | User registers with valid details | `backend/tests/auth.test.js` | `User registers with valid details` |
| US-1.1 | User registers with an email that is already in use | `backend/tests/auth.test.js` | `User registers with an email that is already in use` |
| US-1.1 | User registers with a missing first name | `backend/tests/auth.test.js` | `User registers with a missing first name` |
| US-1.2 | User signs in with valid credentials | `backend/tests/auth.test.js` | `User signs in with valid credentials` |
| US-1.2 | User signs in with an unknown email | `backend/tests/auth.test.js` | `User signs in with an unknown email` |
| US-1.2 | User signs in with an invalid password | `backend/tests/auth.test.js` | `User signs in with an invalid password` |
| US-1.3 | User remains signed in after refresh | `frontend/tests/Login.test.js` | `User remains signed in after refresh` |
| US-1.4 | User signs out | `frontend/tests/MenuBar.test.js` | `User signs out` |
| US-1.4 | Logout without a token is rejected | `backend/tests/auth.test.js` | `Logout without a token is rejected` |
| US-1.5 | Guest cannot create a recipe | `backend/tests/auth.test.js` | `Guest cannot create a recipe` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 1 from @features/feature-1-user-authentication-session-management.md on branch `feature/1-user-authentication-session-management`.

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

- Published recipe list contents — [Feature 2](feature-2-recipe-management.md)
- Ingredient catalog — [Feature 3](feature-3-ingredient-catalog-management.md)
- Password reset, email verification, OAuth, roles
- `GET/PUT/DELETE /recipeapi/users` admin-style user CRUD (not used by the SPA)
