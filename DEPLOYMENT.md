# InsightFlow Edu - Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or use SQLite for quick testing)
- Docker & Docker Compose (optional, for containerized deployment)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Initialize database with sample data:**
   ```bash
   python scripts/init_db.py
   ```

6. **Start the server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

7. **Verify API is running:**
   - Health check: http://localhost:8000/health
   - API docs: http://localhost:8000/api/v1/docs

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - http://localhost:5173

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | admin123 |
| Teacher | priya.sharma@university.edu | faculty123 |
| Student | rahul.sharma@student.edu | student123 |

---

## Docker Deployment (Recommended)

### Development with Docker Compose
```bash
docker-compose up -d
```

Services:
- PostgreSQL: localhost:5432
- Backend API: localhost:8000
- Frontend: localhost:5173

### Production with Docker Compose
```bash
# Set required environment variables
export POSTGRES_PASSWORD=your-secure-password
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
export BACKEND_CORS_ORIGINS='["https://your-domain.com"]'
export VITE_API_URL=https://your-domain.com/api/v1

docker-compose -f docker-compose.yml up -d --build
```

---

## Render Deployment

### Backend on Render (Web Service)

1. **Create new Web Service** connected to your GitHub repo
2. **Configure:**
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory:** `backend` (if using monorepo)
   
3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db  (from Render PostgreSQL)
   SECRET_KEY=your-generated-secret-key
   ENVIRONMENT=production
   DEBUG=false
   BACKEND_CORS_ORIGINS=["https://your-frontend.onrender.com"]
   ```

4. **Add PostgreSQL Database** on Render and link it

### Frontend on Render (Static Site)

1. **Create new Static Site** connected to your GitHub repo
2. **Configure:**
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Root Directory:** `frontend`

3. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/v1
   ```

4. **Add Rewrite Rules** for SPA routing:
   ```
   /* /index.html 200
   ```

---

## Vercel Deployment (Frontend Alternative)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from frontend directory:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api/v1`

---

## Environment Variables Reference

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing key (32+ chars) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ENVIRONMENT` | No | `development` or `production` |
| `DEBUG` | No | `true` or `false` |
| `ALGORITHM` | No | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token expiry (default: 10080) |
| `BACKEND_CORS_ORIGINS` | No | JSON array of allowed origins |
| `MODEL_PATH` | No | Path to ML model (default: app/ml/risk_model.pkl) |
| `OPENAI_API_KEY` | No | For stretch features (RAG/Agent) |

### Frontend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## Database Migrations (Production)

For production deployments, use Alembic for schema migrations:

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head
```

---

## Health Checks

- **Backend:** `GET /health` → Returns `{"status": "healthy", "service": "insightflow-edu-api"}`
- **Frontend:** `GET /` → Returns HTML page (nginx serves static files)

---

## Scaling Considerations

1. **Backend:** Run multiple replicas behind a load balancer
2. **Database:** Use connection pooling (PgBouncer)
3. **ML Model:** The risk model loads into memory on startup; consider model serving for high traffic
4. **Caching:** Add Redis for session caching and rate limiting

---

## Security Checklist (Production)

- [ ] Generate strong `SECRET_KEY` (32+ random chars)
- [ ] Use HTTPS everywhere (Render provides this automatically)
- [ ] Set secure `BACKEND_CORS_ORIGINS` (specific domains only)
- [ ] Use strong PostgreSQL password
- [ ] Enable database SSL
- [ ] Set up monitoring/alerting
- [ ] Configure rate limiting
- [ ] Regular security updates
- [ ] Backup database regularly

---

## Troubleshooting

### Backend won't start
- Check `DATABASE_URL` format
- Verify PostgreSQL is accessible
- Check `SECRET_KEY` is set
- View logs: `docker-compose logs backend`

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Verify nginx config for SPA routing

### Risk assessment returns empty
- Ensure sample data was loaded: `python scripts/init_db.py`
- Check student enrollments exist for the class
- Verify teacher has access to the class

### ML model not found
- Run `python scripts/init_db.py` which trains the model on first run
- Check `app/ml/risk_model.pkl` exists
- Verify model loads in logs on startup