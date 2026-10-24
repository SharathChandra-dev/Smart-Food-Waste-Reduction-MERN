# Interview demo guide

## Suggested 5–7 minute walkthrough

### 1. Problem and user journey (about 1 minute)

“FoodShare helps neighbors keep good food in use. A person can list surplus food, another user can request it, and an administrator reviews the request.” Start on the public food page and show search/category filtering and a listing detail.

### 2. User workflow (about 2 minutes)

Sign in as a regular user. Show **My kitchen** and create or edit one listing. Show the food journal or a tracker to demonstrate user-scoped CRUD. Use a second account if demonstrating a claim from a different user, because the owner cannot request their own listing.

### 3. Admin workflow (about 2 minutes)

Sign in using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the private `server/.env`. Show dashboard metrics, the claims review screen, and one administrative CRUD page (food or users). Approve a pending claim and explain that the API rejects other pending requests for that same listing.

### 4. Database and code (about 1–2 minutes)

Open Compass and show `sfwr_foodshare`, then the `users`, `foods`, `claims`, `intakes`, `contacts`, `headers`, and `trackers` collections. Explain that Mongoose stores documents and ObjectId references, while `populate()` joins display data for API responses. In the editor, show `server/src/models/index.js`, `server/src/middleware/auth.js`, and one route group in `server/src/routes/api.js`.

## Architecture explanation

“The browser is a React single-page app. Axios sends same-origin API requests; Vite proxies them to Express during development. Express validates input, authenticates the HTTP-only JWT cookie, and applies the Admin check for privileged routes. Mongoose maps the domain to Atlas collections. SMTP and file uploads are separate integrations.”

## Before presenting

- Start from the separate `Smart Food Waste Reduction MERN` folder, not the Laravel project or older nested MERN copy.
- Ensure Atlas shows the app's IP address as allowed and Compass is connected to the same cluster/database.
- Run `npm run seed` only if the sample Admin/catalog need to be initialized or refreshed; it updates only the matching sample catalog records plus the configured Admin role.
- Keep `server/.env` private. Use the Admin email/password from that file; never put credentials in slides or screen share.
- The local development uploads directory contains demo files. Avoid showing personal data in Compass; use the sample dataset or a dedicated demo account.
- Email replies require valid SMTP settings. If SMTP is not configured, explain the integration rather than claiming that a live email was delivered.
- If the client port changes because the default is occupied, open Vite's printed URL and set `CLIENT_URL` to that origin in `server/.env`.

## Likely interview questions

**Why MongoDB?** Listings, users, and workflow records are stored as documents; references preserve ownership and request relationships. This project uses Mongoose for schema validation, indexes, and relationship population.

**How are admin routes protected?** The API authenticates the cookie, loads the current user, then checks the database role in Admin middleware. The UI route guard improves navigation but is not the security boundary.

**How does a claim work?** A signed-in user creates a pending claim. The Admin changes it to approved/rejected. Approving one rejects other pending claims for that listing.

**What would you improve for production?** Add automated integration tests, move uploads to object storage, use least-privilege Atlas access, add deployment/monitoring, and configure production secrets/HTTPS/SMTP.
