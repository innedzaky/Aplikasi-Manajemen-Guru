# Cloudflare Worker API Layer — Sistem Manajemen Guru

## Ikhtisar Arsitektur
Worker ini bertindak sebagai **Primary API Gateway** yang melayani antarmuka pengguna (React SPA) dan berinteraksi langsung dengan **Cloudflare D1 Relational SQLite Database**.

### Pemisahan Tanggung Jawab (Layered Architecture):
```
Client (React Frontend)
          │  HTTPS JSON / Bearer Token
          ▼
Cloudflare Worker (src/index.ts)
          │
  ├── Middleware (Auth, School Scoping, RBAC, CORS)
  ├── Router & Controllers (HTTP Request/Response Mapping)
  ├── Services (Business Validation, Assignment Ownership, Multi-record Transactions)
  └── Repositories (Prepared SQL Statements on D1 Binding)
          │
          ▼
   Cloudflare D1 (Primary SQLite DB)
          │
          └── sync_queue (Outbox Pattern to Google Apps Script)
```

---

## Panduan Menjalankan Lokal (Development)

1. Masuk ke direktori worker:
   ```bash
   cd worker
   npm install
   ```
2. Jalankan lokal simulator D1 & Worker:
   ```bash
   npx wrangler dev
   ```

---

## Endpoint API Utama

- `POST /api/auth/login` — Autentikasi sesi & token generator
- `POST /api/auth/logout` — Pencabutan sesi aktif
- `GET /api/auth/me` — Profil user dan daftar penugasan aktif
- `GET /api/dashboard` — Ringkasan metrik dashboard
- `GET /api/teachers`, `POST /api/teachers`, `PUT /api/teachers/:id`, `DELETE /api/teachers/:id`
- `GET /api/students`, `POST /api/students`, `PUT /api/students/:id`, `DELETE /api/students/:id`
- `GET /api/classes`, `POST /api/classes`, `PUT /api/classes/:id`, `DELETE /api/classes/:id`
- `GET /api/subjects`, `POST /api/subjects`, `PUT /api/subjects/:id`, `DELETE /api/subjects/:id`
- `GET /api/assignments`, `POST /api/assignments`, `PUT /api/assignments/:id`, `DELETE /api/assignments/:id`
- `GET /api/attendance`, `POST /api/attendance`, `PUT /api/attendance/:id`
- `GET /api/assessments`, `POST /api/assessments`, `PUT /api/assessments/:id`, `DELETE /api/assessments/:id`
- `GET /api/grades`, `POST /api/grades`, `PUT /api/grades/:id`
- `GET /api/journals`, `POST /api/journals`, `PUT /api/journals/:id`, `DELETE /api/journals/:id`
