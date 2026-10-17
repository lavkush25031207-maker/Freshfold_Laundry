# FreshFold Laundry System

Full-stack laundry pickup application with customer authentication, booking, live order tracking, and an operations dashboard.

## Tech stack

- **Frontend:** React, Vite, React Router, responsive CSS
- **Backend:** Java 21, Spring Boot, Spring Security, JDBC, Flyway
- **Database:** MySQL 8+
- **Deployment:** Render (API), Vercel or GitHub Pages (frontend)

## Local development

Requirements: Node.js 20+, Java 21, Maven 3.9+, and Docker Desktop.

```bash
docker compose up -d
cd backend
./mvnw spring-boot:run
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:8080/api`.

Copy `frontend/.env.example` to `frontend/.env` to configure local frontend variables.

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Prepare FreshFold for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Never commit real database passwords, admin credentials, or Google Maps keys.

## 2. Deploy the backend on Render

The root `render.yaml` and `backend/Dockerfile` configure the Spring Boot service.

1. Create a hosted MySQL database on a provider such as Aiven, Railway, or DigitalOcean.
2. In Render, choose **New > Blueprint** and connect this repository.
3. Set these environment variables when prompted:

| Variable | Example |
| --- | --- |
| `DB_URL` | `jdbc:mysql://HOST:PORT/freshfold?sslMode=REQUIRED&serverTimezone=UTC` |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `APP_ADMIN_EMAIL` | Private production admin email |
| `APP_ADMIN_PASSWORD` | Strong production password |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app,https://USER.github.io` |

Render supplies `PORT` automatically. Verify deployment at:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should be `{"status":"ok"}`. Flyway creates and seeds the database during startup.

## 3A. Deploy the frontend on Vercel

The root `vercel.json` configures the frontend build and SPA route fallback.

1. Import the GitHub repository into Vercel.
2. Keep the project root as the repository root.
3. Add these environment variables for Production and Preview:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser-restricted Google Maps key |
| `VITE_ROUTER_MODE` | `browser` |

4. Deploy, then add the final Vercel domain to Render's `CORS_ALLOWED_ORIGINS` and redeploy the API.

## 3B. Deploy the frontend on GitHub Pages

The `.github/workflows/deploy-pages.yml` workflow builds and deploys the frontend whenever `main` is updated.

1. Open the repository's **Settings > Secrets and variables > Actions**.
2. Add repository secret `VITE_API_URL` with the Render API URL ending in `/api`.
3. Optionally add `VITE_GOOGLE_MAPS_API_KEY`.
4. Open **Settings > Pages** and select **GitHub Actions** as the source.
5. Push to `main` or manually run the workflow.
6. Add `https://YOUR_USERNAME.github.io` to Render's `CORS_ALLOWED_ORIGINS`.

GitHub Pages uses hash routing so direct links and page refreshes work without a custom server.

## Production checklist

- Replace the default admin credentials with strong private values.
- Restrict the Google Maps key to the Vercel and GitHub Pages domains.
- Confirm `/api/health` returns successfully.
- Confirm signup, login, booking, admin updates, and order tracking.
- Confirm both deployed frontend origins are listed in `CORS_ALLOWED_ORIGINS` without trailing slashes.
