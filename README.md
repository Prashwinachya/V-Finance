# Project V Finance

Laravel and PHP are now the main backend entry point for the website.

The existing React interface in `vfinance/client` is preserved. Laravel serves the SPA shell and fronts the browser-facing API path, so the interface stays the same while the app runs behind a PHP backend.

## Architecture

- Main backend: Laravel at the repository root
- Website interface: React app in `vfinance/client`
- Internal API service: `vfinance/server`

## Development

1. Install PHP dependencies:
	```bash
	composer install
	```
2. Install root tooling:
	```bash
	npm install
	```
3. Install the React and internal API dependencies:
	```bash
	npm --prefix vfinance/client install
	npm --prefix vfinance/server install
	```
4. Create the environment file if needed:
	```bash
	cp .env.example .env
	```
5. Start Laravel, the internal API, and the React dev server:
	```bash
	npm run dev
	```

Open `http://localhost:8000`.

## Production Build

Build the React frontend for Laravel to serve:

```bash
npm run build
```

The built SPA is written to `public/vfinance` and served by Laravel.

## Persistent Data Safety

This project uses a persistent SQLite database file.

- Live database: `database/database.sqlite`
- Automatic backups: `storage/app/backups/database`

To avoid accidental data loss, the app will not silently create a new empty SQLite file if the configured database file is missing. It will fail on startup instead.

Useful commands:

```bash
php artisan data:backup
php artisan data:restore --latest
php artisan data:restore storage/app/backups/database/database_YYYYMMDD_HHMMSS.sqlite
```

The restore command creates a safety copy of the current live database before overwriting it.
# V-Finance (Prashwin PJ)
