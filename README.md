# BANZON Marketplace — Cloudflare starter

This is a Cloudflare Workers + D1 starter for BANZON. It is designed to be uploaded to GitHub and deployed using Cloudflare.

## Included
- Premium blue/white responsive storefront
- Individual and business account registration
- Login with hashed passwords and secure session cookie
- Seller product submission
- Admin product approval API
- Approved product catalogue and search
- Bangladesh Taka (BDT) display

## Important: this is an MVP starter, not a complete production marketplace
Before accepting real orders or money, add payment gateway integration, order/cart and checkout workflow, courier integration, seller payouts, business/KYC verification, image storage (Cloudflare R2), rate limiting, email verification/password reset, privacy/terms/refund policies, audit logs, and security review.
The 3% commission is a business setting only; this starter does not yet collect commission or process payments.

## Deploy outline (Android-friendly)
1. In Cloudflare dashboard, open Workers & Pages and create a D1 database named `banzon-db`.
2. Open the database's Console and run all SQL from `schema.sql`.
3. Copy the database ID into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
4. Create a Worker named `banzon-marketplace`. Deploy `src/worker.js` as the Worker code, and add a D1 binding named `DB` pointing to `banzon-db`.
5. The Worker must be bound to D1 using variable name `DB`. Deploy, then open the `workers.dev` URL.
6. Register your own account. To make the first account admin, run this SQL in D1 Console, replacing the email:
   `UPDATE users SET is_admin=1 WHERE email='YOUR_EMAIL@example.com';`
7. Admin API: GET `/api/admin/pending`; POST `/api/admin/approve` with JSON `{"product_id":1}`. Both require your admin login cookie.

## GitHub
Upload the project folder contents (not just the ZIP) into your GitHub repository. Keep `src/worker.js`, `schema.sql`, `wrangler.toml`, and this README.

## Routes
- `/` storefront
- `/register` account creation
- `/login` login
- `/sell` seller product submission
- `/api/products` GET catalogue / POST product (login required)
- `/api/me` current account
- `/api/my-products` seller listings
- `/api/admin/pending` admin queue
- `/api/admin/approve` admin approval

## Security notes
- Do not share passwords, API tokens, or Cloudflare secrets.
- Cookie sessions are HTTP-only, Secure and SameSite=Lax. For a custom production domain, enforce HTTPS.
- Configure CORS narrowly before adding external frontends.
- Add abuse protection and review all security before public launch.
