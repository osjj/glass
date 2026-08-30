# Glarivo

Glarivo is a focused independent-site MVP with four public sections:

- Home
- Products
- Blog
- About

The project also contains an initial `/admin` interface for future product and blog maintenance.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM 7
- PostgreSQL

## Local development

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

The current public pages use local demonstration data from `src/data`. The admin save actions are intentionally disabled until authentication, PostgreSQL, uploads, and Prisma queries are connected.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```

## Database

Update `DATABASE_URL` in `.env.local`, then run:

```powershell
npm run db:generate
npm run db:migrate -- --name init
```

Do not commit `.env.local`, production secrets, local uploads, or database backups.

## Documentation

- `docs/GLARIVO_MVP_BUILD_AND_DEPLOY_GUIDE.md`
- `docs/GLARIVO_SERVER_ENVIRONMENT_INSTALLATION_INSTRUCTIONS.md`
