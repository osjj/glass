# Case study drafts

The customer-case workflow uses its own `CaseStudy` table and `/admin/case-studies` screens. Blog records are unchanged. The existing hotel design study stays in `src/data/case-studies.ts`.

## Editing and visibility

- Create or edit a case in **Admin → Case Studies**. The form supports project metrics, chapters, paragraphs, key points, editable tables, cover/body image uploads and related links.
- **Preview saved draft** opens the saved version behind administrator authentication. Preview pages are noindex and omit Article structured data.
- `DRAFT`, `ARCHIVED`, and future-dated cases are absent from public routes, the case list and the sitemap. A published case with a publication date at or before the current time appears at `/case-studies/[slug]`.
- Blank publication dates use the current date when first published. Publishing is a separate editorial action; saving a draft does not publish it.
- Concurrent saves and deletes check `updatedAt` to prevent stale tabs from overwriting newer changes.
- Uploaded media uses the `case-studies/` R2 namespace. Removing an image from a case does not delete a shared media object.

## Shangri-La draft saved on September 19, 2026

- Record: `case_2fa6e9de-ff2e-4874-8be1-31ccb30e3832`
- Slug: `shangri-la-hotel-guestroom-glassware`
- Status: **DRAFT**, `publishedAt: null`
- Six chapters, four project metrics, two tables and three images (cover, sample review, packaging).
- Database edit route: `/admin/case-studies/case_2fa6e9de-ff2e-4874-8be1-31ccb30e3832`
- Preview route: `/admin/case-studies/case_2fa6e9de-ff2e-4874-8be1-31ccb30e3832/preview`

Images were generated with the built-in image generation tool and reviewed as illustrations. Versioned R2 objects passed signed readback and public HTTP/content-type/SHA-256 checks. Prompts, PNG originals, WebP metadata and transfer verification are in `output/case-study-drafts-20260919/`; project WebPs are in `public/images/case-studies/shangri-la-hotel-guestroom-glassware/`.

## Deployment handoff

The user chose to deploy the application later. No Git push or server deployment was performed.

The local server at `http://127.0.0.1:3010` uses the normal shared database and existing administrator accounts. Browser lifecycle mutations were tested against an isolated database before switching back to the shared database.

The shared database was backed up to `output/case-study-drafts-20260919/before-case-study-migration.dump` before applying the additive `20260919100000_case_study_drafts` migration. The new table and this draft already exist in the shared database. Existing BlogPost and Product record counts were unchanged.

Deploy the new application source with the existing process. In the application release directory, run the following steps with the normal production environment:

```sh
npm ci --include=dev
npx prisma generate
npx prisma migrate deploy
npm run build -- --webpack
```

Then start/restart the application through the normal server process manager. The migration command will recognize the already applied migration. Check `/admin/case-studies` after signing in; the Shangri-La record must still show Draft. Its public URL should remain 404 until explicitly published.

## Checks

- TypeScript, targeted ESLint, content/visibility tests and production build.
- Isolated local browser create/save/preview, future publication, publish, archive, concurrent edit rejection and delete.
- Unauthenticated admin/preview requests redirect to login; unauthenticated image upload returns 401.
- Authenticated image upload returns 200 with the supplied alt text and the correct R2 namespace; the temporary upload used for verification was removed.
- Draft absent from public list/sitemap and public detail returns 404; existing design study returns 200.
- Desktop 1440px and mobile 390px preview, all three images loaded, no horizontal page overflow.

Temporary `output/` scripts are excluded from the application TypeScript configuration. Application source and checked-in tests remain included.
