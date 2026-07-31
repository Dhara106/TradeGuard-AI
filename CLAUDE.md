# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Docker (full stack)
```bash
docker compose up --build          # builds + starts mongo, django, node, nginx-served frontend
docker compose down -v             # stop and wipe the mongo-data volume
```
Frontend http://localhost:5173 · Node gateway http://localhost:5001/api/health · Django http://localhost:8000/api/health/

The Django image **trains the model at build time** (`generate_dataset.py` + `train_model.py` run in the Dockerfile), so `.pkl` artifacts always match the container's scikit-learn version. `entrypoint.sh` runs `manage.py migrate` then Gunicorn.

### Local dev (three terminals)
```bash
# 1. Django ML service
cd backend-django && pip install -r requirements.txt
python ml/generate_dataset.py && python ml/train_model.py   # required before first run
python manage.py migrate && python manage.py runserver 8000

# 2. Node gateway  (PORT=5000 from backend-node/.env)
cd backend-node && npm install && npm run dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

**Dev proxy target:** `frontend/vite.config.js` proxies `/api` to `http://localhost:5000` by default, matching `PORT` in `backend-node/.env`. Override with `VITE_API_PROXY_TARGET` when the gateway is elsewhere — notably the Docker stack, which publishes it on host port **5001**:
```bash
VITE_API_PROXY_TARGET=http://localhost:5001 npm run dev
```
The Docker frontend never uses this proxy; nginx reverse-proxies to `backend-node:5000` on the internal network.

### Other
- `cd frontend && npm run build` — Vite production build (no lint step, no test suite anywhere in the repo)
- `cd frontend && node screenshot.cjs` — Playwright script that registers a user via the API and captures desktop/tablet/mobile screenshots of every route; expects the dev server on 5173 and Node on 5000

## Architecture

Three services, strictly layered — the browser never talks to Django:

```
React SPA ──/api──► Node/Express gateway ──HTTP──► Django DRF ML service
                          │
                          └──► MongoDB (users, shipments)
```

- **Node is the only service with auth and persistence.** JWT (`protect` in `middleware/authMiddleware.js`), bcrypt users, Mongoose models. Django is stateless and unauthenticated — it must never be exposed publicly.
- **Django owns the model only.** It receives a fully-formed feature dict, returns `{prediction, confidence, riskScore, predictedDelay, reasons}`. It keeps a module-level `prediction_history` list and HashMap cache that reset on restart — they are demo state, not a data store.
- **Request path in dev vs Docker differ:** dev goes through the Vite proxy; Docker goes through `frontend/nginx.conf`, which reverse-proxies `/api/` to `http://backend-node:5000` (same origin, so browser CORS never applies). Node's `cors()` allowlist only matters if something calls it cross-origin directly.

### The prediction flow (`backend-node/routes/predict.js` → `backend-django/predictor/views.py`)
1. Node checks its custom `HashMap` cache keyed on the raw inputs.
2. On a miss it generates a **random `mockDistance`** and hardcodes `season: 'Monsoon'`, then POSTs to Django. Django validates via `ShipmentSerializer` (distance is a *required* field, 1–5000).
3. Django checks its own HashMap cache, runs the model, and computes `riskScore` / `predictedDelay` / `reasons` with rule-based helpers in `ml_model.py` — those are deterministic post-processing, not model outputs.
4. Node persists a `Shipment` doc that doubles as the tracking record, and fires a risk-alert email (not awaited) when `riskScore > 70`.

### One record, two features
A `Shipment` created by `/api/predict` **is** the tracking record. There is no separate tracking collection: `currentLocation`, `currentStatus`, `progress`, `delivered`, `notifications` live on the same document and are mutated by `POST /api/shipments/:id/{advance,deviate,reset}`. The route is a hardcoded demo path `['Ahmedabad','Vadodara','Surat','Mumbai']` in `routes/shipments.js`; `deviate` moves it to Rajkot and bumps `riskScore` by 20.

### ML pipeline (`backend-django/`)
`ml/generate_dataset.py` writes a 5,000-row synthetic CSV → `ml/train_model.py` fits a `RandomForestClassifier(n_estimators=100, max_depth=12)` and dumps `fraud_model.pkl`, `scaler.pkl`, `encoders.pkl`, `model_info.pkl`. Both the CSV and `.pkl` files are gitignored — they must be regenerated on any fresh checkout.

Inference (`predictor/ml_model.py`) does **not** use the saved `encoders.pkl`. It uses hardcoded `CITY_ENCODING` / `CARRIER_ENCODING` / `SEASON_ENCODING` dicts and builds the feature array by hand. Two consequences when touching either file:
- The inference feature order is `[origin, destination, weight, distance, weather, traffic, carrier, season, risk_composite, weight_distance_ratio]`, while training feeds columns in the order `[origin, destination, carrier, season, weight, distance, weather, traffic, risk_composite, weight_distance_ratio]`. They do not line up.
- `CARRIER_ENCODING` maps `DTDC:1, DHL:2`, but `LabelEncoder` on the dataset sorts to `DHL:1, DTDC:2`.

If you change encodings, feature engineering, or column order, change **both** files together. `predict()` silently falls back to `_rule_based_prediction()` when the `.pkl` files are missing, so a broken model does not surface as an error.

### Frontend (`frontend/src/`)
- **No Tailwind**, despite the README badge. Styling is a single hand-written ~4,600-line `src/index.css` design system driven by CSS custom properties; `ThemeContext` toggles a `light`/`dark` class on `<html>`. `riskBadgeClasses()` / `statusBadgeClasses()` in `utils/riskLogic.js` still return Tailwind class strings and are unused — don't copy that pattern.
- **Dark mode is token-driven.** Anything added to `:root` that is used as a *surface* or as *text on a dark-overridden surface* must also be overridden in the `html.dark` block, or it silently renders at ~1:1 contrast. `--primary` is a surface colour, not just text.
- `ThemeContext.setTheme` writes the `<html>` class **synchronously before** the state update, because `ShipmentChart` resolves its palette from CSS custom properties during render. Reverting that to a plain `useEffect` makes charts paint the previous theme.
- Provider stack in `main.jsx`: `MotionConfig` → `LazyMotion(strict)` → `BrowserRouter` → Theme → Auth → Toast. `LazyMotion` is strict, so components must import `m` from framer-motion, never `motion`. `motionFeatures.js` lazily loads `domMax` (required — `layout`/`layoutId` are in use); don't let a `manualChunks` rule pull `framer-motion` into an eager vendor chunk or that split collapses.
- All routes are lazy-loaded in `App.jsx` via `lazyRoute()`, which also exposes `.preload()`; post-login routes are warmed on idle. `Suspense` sits **above** `AnimatePresence` — moving it back inside the keyed `m.div` makes the fallback spinner play the enter animation while real content appears with none. Page chrome (navbar/footer) is keyed off `chromeRoute`, advanced in `onExitComplete`, so it can't unmount mid-exit and jolt the outgoing page.
- Anything animated with framer-motion must not also set `transform` in CSS — `buildTransform` writes the whole property and silently drops it.
- `services/api.js` is the only HTTP entry point: attaches the JWT from localStorage, and on a 401 clears the token and dispatches a `tradeguard:unauthorized` window event that `AuthContext` listens for.
- Live weather comes from Open-Meteo, called **directly from the browser** in `pages/Predict.jsx` (`handleAutoDetect`) using a hardcoded `CITY_COORDS` table — it never goes through the backend. `utils/riskLogic.js` derives the displayed weather/traffic/overall risk cards from the 1–10 scores client-side; that overall score is a different number from the backend `riskScore`.
- Shared primitives live in `components/ui.jsx` (`PageIntro`, `MetricCard`, `RiskBadge`, `LoadingState`, `EmptyState`, `AuthShell`, …). Reuse them rather than adding one-off markup.

### Custom data structures
`backend-node/utils/dataStructures.js` and `backend-django/predictor/data_structures.py` implement PriorityQueue (max-heap), HashMap (chaining), merge sort, and binary search from scratch. They are wired into live code paths on purpose (`GET /api/shipments` sorts via `mergeSort`, `/api/predict` caches via `HashMap`, `/api/predict/risky` ranks via `PriorityQueue`) as an academic requirement — keep using them there instead of swapping in `Array.prototype.sort` or a plain object.

## Gotchas

- Deleting a shipment is `POST /api/shipments/delete/:id`, not `DELETE /api/shipments/:id` as the README claims.
- Node stores `predictionResult.distance || 500`, but Django returns distance nested under `shipmentDetails`, so every saved shipment's `distance` is 500.
- Express route order matters: `/api/shipments/stats` is declared before `/api/shipments/:id`. Adding new literal sub-paths below the `:id` route will shadow them.
- Email is optional everywhere. With `EMAIL_USER`/`EMAIL_PASS` unset, nodemailer calls fail and are caught/logged; registration and prediction still succeed.
- The rate limiter is 100 requests per IP per 15 min across all of `/api/` — easy to hit while iterating on the frontend.
- `backend-node/.env` exists on disk with placeholder credentials and the default JWT secret. There is no `.git` directory here despite the `.gitignore` — this working copy is not a repository.
