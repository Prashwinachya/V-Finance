**Postgres Development Setup**

1. Start a local Postgres using Docker Compose:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

2. Copy the example env and update `DB_CONNECTION` if needed:

```bash
cp .env.postgres.example .env
```

3. Run the helper script to wait for the DB, run migrations and seeders:

```bash
bash scripts/setup-postgres.sh
```

Notes:
- The project defaults to SQLite in `.env.example`; use `.env.postgres.example` if you want Postgres locally.
- We added transaction indexes in `database/migrations/2026_06_16_000001_add_transactions_indexes.php` which improves query speed.
- For production, prefer a managed Postgres (RDS, Cloud SQL, Neon) and enable backups + PITR.
