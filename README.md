# Easy EYE — luxury eyewear e-commerce (course project)

React + FastAPI + Supabase + Stripe (test mode).

## Setup
1. **Supabase**: create a project → SQL editor → run `supabase/migrations/001_schema.sql`, then `supabase/seed.sql`.
   Sign up once in the app, then promote yourself in the SQL editor:
   `update profiles set role = 'admin' where email = 'you@example.com';`
2. **Backend**: `cd backend && cp .env.example .env` (fill in keys; use the *service role* key) →
   `pip install -r requirements.txt` → `uvicorn app.main:app --reload`
3. **Stripe webhook** (needed for orders to become "paid"):
   `stripe listen --forward-to localhost:8000/webhooks/stripe` → copy the `whsec_...` into `.env`.
4. **Frontend**: `cd frontend && cp .env.example .env` (anon key + URLs) → `npm install` → `npm run dev`.
   Test card: 4242 4242 4242 4242.

## Architecture
- React talks to Supabase directly for auth, catalog reads, cart, wishlist, profile (RLS enforces ownership).
- FastAPI handles what needs secrets or elevated rights: checkout (reads cart server-side, so prices can't be tampered with), the Stripe webhook, admin product CRUD, admin order updates.
- Orders become `paid` only via the signature-verified webhook, which calls `fulfill_order()` — an atomic SQL function that decrements stock and clears the cart.
- `profiles.role` can't be changed by users (trigger); admins are promoted via SQL.

## Known limitations (list these in your report)
- No product variants or prescription lenses; each colour is its own product.
- Cart requires login (no guest cart).
- Images are URLs; a `product-images` storage bucket + admin policy exist but there is no upload UI yet.
- If stock runs out between checkout and payment, `fulfill_order` fails and Stripe retries; a real shop would auto-refund.
- Hero uses a placeholder image; swap in real photography.
