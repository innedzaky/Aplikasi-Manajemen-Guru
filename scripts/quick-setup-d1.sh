#!/usr/bin/env bash
# ==============================================================================
# QUICK SCRIPT: SETUP & MIGRASI DATABASE CLOUDFLARE D1
# ==============================================================================

set -e

DB_NAME=${1:-"db_sistem_manajemen_guru"}
WORKER_NAME=${2:-"api-sekolah-d1"}

echo "🔧 Memulai Inisialisasi Cloudflare D1 Database: $DB_NAME..."

cd "$(dirname "$0")/../worker"

# 1. Buat database D1 jika belum ada
echo "1. Membuat database D1 di Cloudflare..."
npx wrangler d1 create "$DB_NAME" || true

# 2. Ambil info ID database
echo "2. Membaca konfigurasi database..."
DB_INFO=$(npx wrangler d1 info "$DB_NAME" 2>&1 || true)
echo "$DB_INFO"

# 3. Jalankan Migrasi Skema, Indeks, dan Data Master
echo "3. Menjalankan migrasi tabel SQL ke database D1 remote..."
npx wrangler d1 execute "$DB_NAME" --remote --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute "$DB_NAME" --remote --file=./migrations/0002_indexes.sql
npx wrangler d1 execute "$DB_NAME" --remote --file=./migrations/0003_seed.sql

echo "✅ Database D1 ($DB_NAME) berhasil dibuat dan dimigrasi dengan 19 tabel lengkap!"
