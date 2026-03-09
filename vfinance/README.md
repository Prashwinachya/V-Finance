# VFinance (React + Express + MongoDB)

## Stack
- Frontend: React + Vite + Tailwind CSS + Recharts + Lucide React
- Backend: Node.js + Express + MongoDB + JWT Auth

## Run Backend
1. Copy `server/.env.example` to `server/.env`
2. Update MongoDB and JWT values
3. Install and run:
   ```bash
   cd server
   npm install
   npm run dev
   ```

## Run Frontend
1. Copy `client/.env.example` to `client/.env`
2. Install and run:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Default Routes
- Dashboard: `/`
- Transactions: `/transactions`
- Wallets: `/wallets`
- Trip Planner: `/trip-planner`
- Admin: `/admin`
- Login/Register: `/login`

## API Overview
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Dashboard: `/api/dashboard`
- Transactions CRUD: `/api/transactions`
- Wallets + details + add/withdraw: `/api/wallets`
- Trips CRUD: `/api/trips`
- Admin: `/api/admin/stats`, `/api/admin/users`, `/api/admin/transactions`, `/api/admin/budgets`
