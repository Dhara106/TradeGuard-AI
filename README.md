<div align="center">
  <h1>🛡️ TradeGuard AI</h1>
  <p><strong>AI-Powered Shipment Risk Intelligence & Logistics Dashboard</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Django-DRF-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Python-Scikit--Learn-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/Architecture-Microservices-blue?style=flat-square" alt="Architecture" />
  </p>
</div>

---

## 📋 About

TradeGuard AI is a production-grade, microservices-based supply chain intelligence application that uses **Machine Learning** to predict cargo delivery delays and evaluate transit risks in real-time.

The system connects to live weather APIs, analyzes route conditions, and provides logistics managers with actionable risk assessments — complete with confidence scores, delay estimates, and automated email alerts.

---

## ✨ Features

- 🧠 **AI Risk Prediction** — Random Forest Classifier trained on 5,000+ synthetic logistics records
- 🌍 **Live Weather API** — Real-time weather detection via Open-Meteo API (no API key needed)
- 📊 **Interactive Dashboard** — Recharts-powered analytics with Pie and Bar charts
- 🔐 **JWT Authentication** — Secure login/register with Bcrypt password hashing
- 📧 **Email System** — Verification, password reset, welcome emails, and high-risk alerts via Nodemailer
- 🛡️ **Security Hardened** — Helmet, Rate Limiting, CORS, Morgan logging
- 📱 **Responsive UI** — TailwindCSS glassmorphism design (Desktop, Tablet, Mobile)
- 🗄️ **Data Structures** — Custom Priority Queue, HashMap, Merge Sort, Binary Search implementations
- 📖 **Self-Documenting API** — Built-in `/api/docs` endpoint
- 🐳 **Docker Ready** — Docker Compose for one-command deployment

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   React + Vite  │────►│  Node.js + Express   │────►│  Django + Scikit    │
│   (Port 5173)   │     │  API Gateway (5000)  │     │  ML Service (8000)  │
│                 │◄────│                      │◄────│                     │
│  • Dashboard    │     │  • JWT Auth          │     │  • Random Forest    │
│  • Predict Page │     │  • Rate Limiting     │     │  • Feature Scaling  │
│  • History      │     │  • Email Service     │     │  • Risk Calculation │
│  • Profile      │     │  • Helmet Security   │     │  • Synthetic Data   │
└─────────────────┘     └──────────┬───────────┘     └─────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │    MongoDB      │
                          │  (Local/Atlas)  │
                          └─────────────────┘
```

---

## 🚀 Quick Start

### Option A — Docker (recommended) 🐳

The entire stack (MongoDB + Django ML + Node gateway + React) runs with a **single command**. The only prerequisite is [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/Dhara106/TradeGuard-AI.git 
cd tradeguard-ai
docker compose up --build
```

Then open **http://localhost:5173**.

- The synthetic dataset is generated and the Random Forest model is trained **inside** the Django image at build time, so the pickled artifacts always match the container's scikit-learn version.
- MongoDB data is persisted in the `mongo-data` Docker volume.
- Email features (verification / alerts) are optional. To enable them, copy `.env.example` to `.env` and fill in `EMAIL_USER` / `EMAIL_PASS` (a Gmail **App Password**). Without them, the app runs fine and email steps simply no-op.

To stop: `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the database volume).

| Service | URL |
|:--------|:----|
| Frontend (nginx) | http://localhost:5173 |
| Node API gateway | http://localhost:5001/api/health |
| Django ML service | http://localhost:8000/api/health/ |
| MongoDB | mongodb://localhost:27017 |

> **Port note:** The Node gateway is published on host port **5001** by default (its internal port stays 5000, which is what the frontend proxies to). This avoids clashing with a local Node dev server on 5000. If a local **Vite** dev server is already running on **5173**, either stop it or set `FRONTEND_HOST_PORT` in a root `.env` — otherwise the browser hits your local server instead of the container. All host ports are overridable via `.env` (`FRONTEND_HOST_PORT`, `API_HOST_PORT`).

### Option B — Manual (local dev)

**Prerequisites:** Node.js v18+, Python 3.10+, MongoDB (local or Atlas).

**1. Django ML Service (Terminal 1)**
```bash
cd backend-django
pip install -r requirements.txt
python ml/generate_dataset.py    # Generate synthetic dataset
python ml/train_model.py         # Train Random Forest model
python manage.py migrate
python manage.py runserver 8000
```

**2. Node.js API Gateway (Terminal 2)**
```bash
cd backend-node
cp .env.example .env             # then edit MONGO_URI etc.
npm install
npm run dev
```

**3. React Frontend (Terminal 3)**
```bash
cd frontend
npm install
npm run dev
```

**4. Open** http://localhost:5173

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|:------:|:---------|:------------|:----:|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login with credentials | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/auth/verify-email` | Verify email token | ❌ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |
| GET | `/api/shipments` | Get user's shipments | ✅ |
| GET | `/api/shipments/stats` | Dashboard statistics | ✅ |
| DELETE | `/api/shipments/:id` | Delete shipment | ✅ |
| POST | `/api/predict` | AI risk prediction | ✅ |
| GET | `/api/health` | Health check | ❌ |
| GET | `/api/docs` | API documentation | ❌ |

---

## 🧪 Data Structures & Algorithms

| Structure | Implementation | Usage |
|:----------|:--------------|:------|
| **Priority Queue (Max-Heap)** | Custom array-based binary heap | Ranks shipments by risk score |
| **HashMap** | Custom hash with chaining | Caches prediction results |
| **Merge Sort** | Divide & Conquer | Sorts shipment history |
| **Binary Search** | Iterative search | Fast lookup in sorted data |

---

## 🔐 Environment Variables

### backend-node/.env
```env
MONGO_URI=mongodb://localhost:27017/tradeguard
JWT_SECRET=tradeguard_super_secret_key_2026
PORT=5000
DJANGO_ML_URL=http://localhost:8000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

---

## 📁 Project Structure

```
tradeguard-ai/
├── frontend/                     # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/           # Navbar, Footer, Toast, Skeleton, Charts, Tables
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Predict,
│   │   │                         # History, Profile, ForgotPassword, ResetPassword,
│   │   │                         # VerifyEmail, NotFound
│   │   └── services/             # Axios API client
│   └── index.html
├── backend-node/                 # Node.js + Express API Gateway
│   ├── config/                   # MongoDB connection
│   ├── middleware/               # JWT auth, Error handler
│   ├── models/                   # User, Shipment schemas
│   ├── routes/                   # Auth, Shipments, Predict, Docs
│   └── utils/                    # Data Structures, Email Service
├── backend-django/               # Django + DRF ML Microservice
│   ├── predictor/                # Views, Serializers, ML Model
│   └── ml/                       # Dataset generator, Model trainer
├── docker-compose.yml            # Container orchestration
├── .gitignore
└── README.md
```

---

## 🐳 Docker Deployment

One command builds and starts all four services:

```bash
docker compose up --build          # foreground
docker compose up --build -d       # detached (background)
docker compose logs -f             # tail logs
docker compose down                # stop (keep data)
docker compose down -v             # stop + wipe MongoDB volume
```

**What each image does**
- **frontend** — multi-stage build: Vite compiles the React app, then nginx serves the static bundle and reverse-proxies `/api/*` to the Node gateway (same-origin, so no CORS in the browser).
- **backend-node** — Express API gateway on Node 20 (Alpine), runs as a non-root user with a container healthcheck.
- **backend-django** — Django + DRF served by Gunicorn; the ML model is retrained during the image build and DB migrations run on startup.
- **mongodb** — official Mongo 7 image with a persistent named volume and healthcheck.

The Node gateway waits for MongoDB to become healthy before starting (via `depends_on` conditions).

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

<!-- <div align="center">
  <p><strong>Built with ❤️ by Dhara Sojitra</strong></p>
  <p>LJ University • CSE-DS • 2026</p>
</div> -->
