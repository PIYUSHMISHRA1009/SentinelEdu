# InsightFlow EDU - Quick Start Commands
**No PowerShell Scripts Required!**

## 🗄️ Database Setup (Choose One Method)

### Method 1: All-in-One Command (Recommended)
```bash
sqlplus INSIGHTFLOW/your_password@localhost:1521/FREEPDB1 "@E:\Projects\PSE\insightflow-edu\database\run_all_setup.sql"
```

### Method 2: Step-by-Step
```bash
# Connect first
sqlplus INSIGHTFLOW/your_password@localhost:1521/FREEPDB1

# Then run each script:
@E:\Projects\PSE\insightflow-edu\database\ddl\01_create_tables.sql
@E:\Projects\PSE\insightflow-edu\database\plsql\02_procedures_functions.sql
@E:\Projects\PSE\insightflow-edu\database\sample_data\03_insert_data.sql
@E:\Projects\PSE\insightflow-edu\database\verify_setup.sql
exit
```

**Note:** Replace `your_password` with your actual INSIGHTFLOW user password.

---

## 🚀 Backend Setup

```bash
# Navigate to backend
cd E:\Projects\PSE\insightflow-edu\backend\insightflow-backend

# Build (first time or after changes)
mvn clean package

# Run the server
mvn spring-boot:run
```

**Backend URL:** http://localhost:8080  
**Keep this terminal open!**

---

## 🎨 Frontend Setup

```bash
# Open a NEW terminal
cd E:\Projects\PSE\insightflow-edu\frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

**Frontend URL:** http://localhost:5173  
**Keep this terminal open too!**

---

## ✅ Quick Test

```bash
# Test backend API (open another terminal)
curl http://localhost:8080/api/dashboard/stats

# Test login
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"faculty\",\"password\":\"faculty123\"}"
```

---

## 🌐 Access Application

1. Open browser: **http://localhost:5173**
2. Login: **faculty / faculty123**
3. Explore the features!

---

## 📊 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Faculty | `faculty` | `faculty123` |
| Admin | `admin` | `admin123` |
| IT | `it` | `it123` |

---

## 🐛 Troubleshooting

### Backend won't connect to database?
```sql
# Verify database is set up:
sqlplus INSIGHTFLOW/your_password@localhost:1521/FREEPDB1
SELECT COUNT(*) FROM user_tables;
-- Should return 8
```

### CORS errors in browser?
- Make sure backend is running on port 8080
- Make sure frontend is on port 5173

### "Interventions table not found"?
```bash
# Re-run the DDL script (it's fixed now):
sqlplus INSIGHTFLOW/your_password@localhost:1521/FREEPDB1 "@E:\Projects\PSE\insightflow-edu\database\ddl\01_create_tables.sql"
```

---

## 📋 Execution Order

1. **Database Setup** (once) - Use Method 1 above
2. **Backend** (keep running) - `mvn spring-boot:run`
3. **Frontend** (keep running) - `npm run dev`
4. **Browser** - Open http://localhost:5173

---

## 🎬 Ready to Demo!

Follow: `backend/insightflow-backend/DEMO_SCRIPT.md`

**Total Setup Time:** ~10 minutes  
**Demo Time:** 5-7 minutes
