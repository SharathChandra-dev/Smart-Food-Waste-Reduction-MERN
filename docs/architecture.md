# Architecture and API map

## Request flow

1. React pages call the shared Axios client in `client/src/api.js` with relative `/api` URLs.
2. Vite proxies `/api` and `/uploads` to the Express server during development. In production, Express serves the built React client and API from one origin.
3. Express applies Helmet, CORS, JSON parsing, cookies, and authentication rate limits before routing.
4. `auth` verifies the HTTP-only `sfwr_token` JWT and loads the user. `admin` separately checks the persisted `role_sfwr` value before allowing administrative routes.
5. Route handlers use Mongoose models in `server/src/models/index.js` to read/write Atlas. `populate()` resolves relationships such as claim→food and claim→user.
6. Nodemailer sends SMTP email. Image uploads are type/size checked and written to `server/uploads`.

## Main code locations

| Path                            | Responsibility                                                           |
| ------------------------------- | ------------------------------------------------------------------------ |
| `client/src/App.jsx`            | Routes, site shell, protected routes, admin layout                       |
| `client/src/pages.jsx`          | Public, account, user, and admin screens                                 |
| `client/src/context.jsx`        | Current-user state and session bootstrap                                 |
| `client/src/api.js`             | Axios API client, error messages, image URLs                             |
| `server/src/index.js`           | Express setup, security middleware, DB connection, static client serving |
| `server/src/routes/api.js`      | REST endpoints and validation/business rules                             |
| `server/src/middleware/auth.js` | Authentication and Admin role checks                                     |
| `server/src/models/index.js`    | Mongoose schemas, indexes, references                                    |
| `server/src/utils/mail.js`      | SMTP transport and email sending                                         |
| `server/src/seed.js`            | Idempotent Admin/catalog bootstrap and sample-data refresh               |

## Route groups and access

All paths below are prefixed by `/api`.

| Group                   | Example routes                                                                                | Access                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Health/settings         | `GET /health`, `GET /settings`                                                                | Public                                                                         |
| Authentication          | `POST /auth/register`, `/auth/login`, `/auth/2fa/verify`; `GET /auth/me`; `POST /auth/logout` | Register/login public; session routes require authentication where appropriate |
| Public food             | `GET /foods`, `GET /foods/:id`                                                                | Public                                                                         |
| Food management         | `POST /foods`, `PUT /foods/:id`, `DELETE /foods/:id`, `GET /my/foods`                         | Signed-in owner; Admin can manage any listing                                  |
| Claims                  | `POST /foods/:id/claim`, `GET /my/claims`                                                     | Signed-in user                                                                 |
| Claim review            | `GET /admin/claims`, `PATCH /admin/claims/:id`                                                | Admin                                                                          |
| Intake/profile/trackers | `/intakes`, `/profile`, `/trackers/:kind`                                                     | Signed-in user; scoped to their account                                        |
| Admin content/users     | `/admin/foods`, `/admin/users`, `/admin/headers`, `/admin/dashboard`                          | Admin                                                                          |
| Contact                 | `POST /contacts`                                                                              | Public; persisted in MongoDB                                                   |
| Contact inbox/reply     | `GET /admin/contacts`, `POST /admin/contacts/:id/reply`                                       | Admin; reply delivery requires SMTP                                            |

## Authorization and data rules

- Passwords are bcrypt-hashed. The user schema excludes the password and 2FA secret by default.
- The JWT is stored in an HTTP-only, SameSite=Lax cookie. In production set `COOKIE_SECURE=true` behind HTTPS.
- Authentication endpoints are rate-limited. Admin access is enforced in the API, not just hidden in the React UI.
- Food update/delete checks ownership for regular users; tracker/intake queries are user-scoped.
- Approval of one pending food request rejects other pending requests for that listing.
- The `users.email_sfwr` unique index prevents duplicate accounts. The claims compound partial unique index prevents duplicate pending claims.

## Local vs production considerations

The current development upload adapter writes files to the API's local `server/uploads` directory; local files are not durable across all hosting platforms. A production deployment should store uploads in object storage, use HTTPS and secure cookies, use a least-privilege Atlas database user, configure SMTP, and supply persistent secrets through the host's secret manager.
