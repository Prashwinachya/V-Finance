#!/usr/bin/env bash
set -eu

echo "Starting Postgres (docker-compose.postgres.yml)..."
docker compose -f docker-compose.postgres.yml up -d db

echo "Waiting for Postgres to become ready..."
until docker exec vfinance_postgres pg_isready -U vfinance -d vfinance_dev >/dev/null 2>&1; do
  sleep 1
done

echo "Running migrations and seeders..."
php artisan migrate --force
php artisan db:seed --class=UserSeeder --force

echo "Done. Postgres is ready and seeded."
