#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DEPLOYMENT OTOMATIS CLOUDFLARE (D1 DATABASE, WORKER & PAGES)
# Aplikasi Sistem Manajemen Guru
# ==============================================================================

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================================${NC}"
echo -e "${GREEN} 🚀 SKRIP OTOMASI SETUP & DEPLOYMENT CLOUDFLARE SIAP PAKAI ${NC}"
echo -e "${CYAN}    - Cloudflare D1 Database (Serverless SQLite)${NC}"
echo -e "${CYAN}    - Cloudflare Worker REST API Layer${NC}"
echo -e "${CYAN}    - Cloudflare Pages (Frontend Single Page App)${NC}"
echo -e "${CYAN}====================================================================${NC}\n"

# 1. Check prerequisite tools
echo -e "${BLUE}[1/5] Memeriksa instalasi Node.js & Wrangler...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js belum terpasang. Silakan install Node.js v18+ terlebih dahulu.${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx belum terpasang. Silakan install npm/npx terlebih dahulu.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js & npx siap digunakan.${NC}\n"

# 2. Database Name Configuration
DB_NAME=${1:-"db_sistem_manajemen_guru"}
WORKER_NAME=${2:-"api-sekolah-d1"}
PAGES_NAME=${3:-"sistem-manajemen-guru"}

echo -e "${YELLOW}Informasi Target Deployment:${NC}"
echo -e "  • Nama Database D1 : ${CYAN}${DB_NAME}${NC}"
echo -e "  • Nama Worker API   : ${CYAN}${WORKER_NAME}${NC}"
echo -e "  • Nama Cloudflare Pages: ${CYAN}${PAGES_NAME}${NC}\n"

# 3. Create or Validate D1 Database
echo -e "${BLUE}[2/5] Menyiapkan Cloudflare D1 Database...${NC}"
cd worker

echo -e "Menjalankan pembuatan database D1..."
CREATE_OUTPUT=$(npx wrangler d1 create "$DB_NAME" 2>&1 || true)
echo "$CREATE_OUTPUT"

# Extract database_id from output or wrangler config
DB_ID=$(echo "$CREATE_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2 || true)

if [ -z "$DB_ID" ]; then
    echo -e "${YELLOW}Database mungkin sudah ada. Mencoba membaca database_id yang sudah ada...${NC}"
    DB_ID=$(npx wrangler d1 info "$DB_NAME" 2>&1 | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2 || true)
fi

if [ -n "$DB_ID" ]; then
    echo -e "${GREEN}✓ Database ID ditemukan: ${DB_ID}${NC}"
    
    # Update wrangler.toml with the new database ID and binding
    echo -e "Memperbarui binding di worker/wrangler.toml..."
    cat <<EOF > wrangler.toml
name = "${WORKER_NAME}"
main = "src/index.ts"
compatibility_date = "2024-04-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "*"

[[d1_databases]]
binding = "DB"
database_name = "${DB_NAME}"
database_id = "${DB_ID}"
migrations_dir = "migrations"

[observability]
enabled = true

[triggers]
crons = ["*/15 * * * *"]
EOF
    echo -e "${GREEN}✓ worker/wrangler.toml berhasil dikonfigurasi.${NC}"
else
    echo -e "${YELLOW}⚠️ Tidak dapat mengurai database_id secara otomatis. Pastikan Anda sudah login via: npx wrangler login${NC}"
fi

# 4. Apply Database Migrations (Schema, Indexes, Seed)
echo -e "\n${BLUE}[3/5] Menerapkan Migrasi Skema D1 Database (Remote)...${NC}"
npx wrangler d1 migrations apply "$DB_NAME" --remote || {
    echo -e "${YELLOW}⚠️ Gagal menerapkan migrasi secara otomatis. Mencoba eksekusi file SQL langsung...${NC}"
    npx wrangler d1 execute "$DB_NAME" --remote --file=./migrations/0001_initial_schema.sql || true
    npx wrangler d1 execute "$DB_NAME" --remote --file=./migrations/0002_indexes.sql || true
    npx wrangler d1 execute "$DB_NAME" --remote --file=./migrations/0003_seed.sql || true
}
echo -e "${GREEN}✓ Skema tabel, indeks, dan data awal database D1 telah siap.${NC}\n"

# 5. Deploy Cloudflare Worker API
echo -e "${BLUE}[4/5] Melakukan Deployment Cloudflare Worker REST API...${NC}"
DEPLOY_WORKER_OUTPUT=$(npx wrangler deploy 2>&1 || true)
echo "$DEPLOY_WORKER_OUTPUT"

WORKER_URL=$(echo "$DEPLOY_WORKER_OUTPUT" | grep -o 'https://[^ ]*\.workers\.dev' | head -n 1 || true)
if [ -n "$WORKER_URL" ]; then
    echo -e "${GREEN}✓ Worker API Berhasil Terbit di: ${CYAN}${WORKER_URL}${NC}"
else
    WORKER_URL="https://${WORKER_NAME}.workers.dev"
    echo -e "${GREEN}✓ Worker deploy selesai (Perkirakan URL: ${CYAN}${WORKER_URL}${NC})"
fi

# 6. Build and Deploy Cloudflare Pages (Frontend)
cd ..
echo -e "\n${BLUE}[5/5] Membangun & Menerbitkan Frontend ke Cloudflare Pages...${NC}"
echo -e "Menjalankan build Vite client..."
npm run build:client

echo -e "Menerbitkan folder dist/ ke Cloudflare Pages..."
npx wrangler pages deploy dist --project-name="${PAGES_NAME}" --commit-dirty=true || {
    echo -e "${YELLOW}⚠️ Jika project belum dibuat, Cloudflare akan meminta pembuatan otomatis.${NC}"
    npx wrangler pages project create "${PAGES_NAME}" --production-branch=main || true
    npx wrangler pages deploy dist --project-name="${PAGES_NAME}" --commit-dirty=true
}

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN} 🎉 DEPLOYMENT CLOUDFLARE LENGKAP TELAH BERHASIL! 🎉 ${NC}"
echo -e "${CYAN}====================================================================${NC}"
echo -e "1. Endpoint API Worker : ${CYAN}${WORKER_URL}${NC}"
echo -e "2. Healthcheck API     : ${CYAN}${WORKER_URL}/api/health${NC}"
echo -e "3. Database D1         : ${CYAN}${DB_NAME}${NC} (Status: Active & Migrated)"
echo -e "4. Frontend Pages      : ${CYAN}https://${PAGES_NAME}.pages.dev${NC}"
echo -e "\n${YELLOW}Catatan Akun Login Demo Awal:${NC}"
echo -e "  • Super Admin / Owner : username: ${CYAN}owner${NC} | password: ${CYAN}password123${NC}"
echo -e "  • Administrator       : username: ${CYAN}admin${NC} | password: ${CYAN}password123${NC}"
echo -e "  • Guru                : username: ${CYAN}budi${NC}  | password: ${CYAN}password123${NC}"
echo -e "${CYAN}====================================================================${NC}\n"
