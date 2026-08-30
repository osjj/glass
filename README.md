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

The public catalog still uses demonstration data from `src/data`. Product maintenance under `/admin/products` is PostgreSQL-backed with create/edit Server Actions, ordered images, pricing tiers, attributes, specifications, category, and product details. `/admin` requires an active `ADMIN` account. Blog persistence and the public-catalog database switch remain separate follow-up work.

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

## Admin access

Set a cryptographically random `SESSION_SECRET` of at least 32 bytes. Create or rotate an administrator from a trusted server terminal; the password is read from a temporary environment variable and is never printed:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_NAME = "Glarivo Administrator"
$secureAdminPassword = Read-Host "Admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $secureAdminPassword).Password
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
```

The password must be at least 12 characters and contain uppercase, lowercase, numeric, and special characters. Creating an existing email rotates its password and invalidates its prior sessions. Open `/admin/login` to sign in. Five failed attempts lock the account for 15 minutes.

## R2 image storage

Product and blog images can be uploaded to the private `glarivoglass-media` bucket through the
server-side S3-compatible client in `src/lib/r2.ts`. Public reads use the custom hostname
`https://media.glarivoglass.com`; R2 credentials must never be exposed to browser code.

Add the five `R2_*` values from `.env.example` to the local and production environment, then run
the read/write smoke test:

```powershell
npm run r2:smoke
```

The smoke test uploads two versioned WebP files, verifies them through both the R2 API and the
public media hostname, and prints only their public URLs. It does not update the database.

## Documentation

- `docs/GLARIVO_MVP_BUILD_AND_DEPLOY_GUIDE.md`
- `docs/GLARIVO_SERVER_ENVIRONMENT_INSTALLATION_INSTRUCTIONS.md`
