# testproject

A simple Pastebin-like web application built with Node.js, Express, and PostgreSQL.  
Users can create text pastes, optionally set expiry time and maximum view limits, and share them via a unique URL.
Note : in form input insert expire time as minutes but in payload it shows seconds

🔗 Live Demo: https://testproject-phi-ecru.vercel.app/

---

## Features

- Create text pastes
- Optional expiration time (TTL)
- Optional maximum view count
- Unique shareable URLs
- Simple HTML UI (no frontend framework)
- Serverless deployment on Vercel

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Neon)
- **Deployment:** Vercel (Serverless Functions)

---

## Getting Started (Run Locally)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Narayanachigurla/testproject.git
cd testproject
### 2️⃣ Install dependencies
npm install
3️⃣ Create environment variables
DATABASE_URL=postgresql database string
BASE_URL=http://localhost:3000
PORT=3000
TEST_MODE=1  //optional
npm run dev

⚠️ Note:
DATABASE_URL is required both locally and on Vercel
On Vercel, only DATABASE_URL and BASE_URL are needed
Do not commit your .env file to GitHub

| Method | Endpoint          | Description               |
| ------ | ----------------- | ------------------------- |
| GET    | `/`               | Home page with paste form |
| POST   | `/api/pastes`     | Create a new paste        |
| GET    | `/api/pastes/:id` | Fetch paste as JSON       |
| GET    | `/p/:id`          | View paste in browser     |
| GET    | `/api/healthz`    | Health check              |

