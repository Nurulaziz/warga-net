#!/usr/bin/env bash
#
# Script deploy WargaNet — dijalankan oleh GitHub Actions self-hosted runner.
# Runner sudah melakukan checkout kode terbaru sebelum script ini dipanggil.
#
# Alur: install deps -> build backend & frontend -> prisma migrate -> reload PM2.
# Build dijadikan gate: kalau build gagal, deploy berhenti sebelum menyentuh
# service yang sedang berjalan.

set -euo pipefail

# Root repo produksi di server (tempat aplikasi benar-benar dijalankan).
# Fallback ke path absolut jika HOME tidak ter-set di service runner.
APP_DIR="${WARGANET_APP_DIR:-/home/userhcm/warga-net}"
PM2_APP="${WARGANET_PM2_APP:-warganet-backend}"

echo "==> Deploy WargaNet dimulai"
echo "    APP_DIR = $APP_DIR"

cd "$APP_DIR"

echo "==> Tarik kode terbaru"
git fetch --all --prune
git reset --hard origin/main

echo "==> Install dependencies"
pnpm install

echo "==> Generate Prisma Client (Prisma 7: tidak otomatis saat install)"
pnpm --filter @warganet/backend exec prisma generate

echo "==> Build backend"
pnpm --filter @warganet/backend build

echo "==> Build frontend"
pnpm --filter @warganet/frontend build

echo "==> Prisma migrate deploy"
pnpm --filter @warganet/backend exec prisma migrate deploy

echo "==> Reload backend (PM2)"
if pm2 describe "$PM2_APP" > /dev/null 2>&1; then
  pm2 reload "$PM2_APP" --update-env
else
  # Pertama kali: start dari hasil build
  pm2 start "$APP_DIR/apps/backend/dist/main.js" --name "$PM2_APP"
fi
pm2 save

echo "==> Verifikasi backend health"
sleep 4
if curl -fsS http://localhost:3001/api/v1/health > /dev/null; then
  echo "==> Backend sehat. Deploy selesai."
else
  echo "!! Backend TIDAK merespons health check setelah deploy" >&2
  exit 1
fi
