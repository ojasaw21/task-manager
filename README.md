# TaskFlow — Team Task Manager

A Spring Boot task management application with JWT auth, role-based access control (Admin/Member), and a clean vanilla JS frontend.

## Tech Stack
- **Backend:** Java 17, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA
- **Database:** H2 (dev) → PostgreSQL (prod)
- **Frontend:** Vanilla JS + CSS (served as static files by Spring Boot)
- **Deployment:** Railway (Nixpacks, GitHub integration)

---

## Local Development

### Prerequisites
- Java 17+
- Maven 3.8+

### Run locally
```powershell
cd backend

# Build
mvn clean package -DskipTests

# Run with dev profile (H2 in-memory DB + seed data)
java -jar target/task-manager-1.0.0.jar --spring.profiles.active=dev
```

App starts at **http://localhost:8080**

### Demo accounts (seeded automatically in dev)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskmanager.com | Admin123! |
| Member | alice@taskmanager.com | Member123! |
| Member | bob@taskmanager.com | Member123! |
| Member | carol@taskmanager.com | Member123! |

### Stop the app
```powershell
# Kill by port
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force

# Or kill all java processes
Stop-Process -Name java -Force
```

---

## Profiles

| Profile | Database | Seed data |
|---------|----------|-----------|
| `dev` | H2 in-memory | ✅ Auto-seeded |
| `prod` | PostgreSQL (Railway) | ❌ Not seeded |

---

## Railway Deployment

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Create a Railway project
- Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
- **Root Directory:** `backend`
- Railway auto-detects Spring Boot via Nixpacks from `pom.xml`

### 3. Add PostgreSQL
- Railway project canvas → **+ New** → **Database** → **PostgreSQL**

### 4. Set environment variables
In **Web Service → Variables tab**, add:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | *(generate: `openssl rand -hex 32`)* |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `PGUSER` | `${{Postgres.PGUSER}}` |
| `PGPASSWORD` | `${{Postgres.PGPASSWORD}}` |

### 5. Generate a public URL
Railway Dashboard → Service → **Settings → Networking → Generate Domain**

---

## Environment Variables Reference

| Variable | Required in prod | Description |
|----------|-----------------|-------------|
| `SPRING_PROFILES_ACTIVE` | ✅ | Must be `prod` |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (min 32 chars) |
| `DATABASE_URL` | ✅ | Full PostgreSQL connection URL |
| `PGUSER` | ✅ | PostgreSQL username |
| `PGPASSWORD` | ✅ | PostgreSQL password |
| `PORT` | Auto-injected | Railway injects this; app reads `${PORT:8080}` |

> ⚠️ **Never hardcode secrets.** All sensitive values must be set in Railway's Variables tab, not in any committed file.
