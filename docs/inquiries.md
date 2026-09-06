# Customer inquiries

## Customer flow

- Homepage right-hand fixed rail: Email (`sales@garboglass.com`), WhatsApp (`https://wa.me/8618825913441`), and Inquire.
- Inquire opens a keyboard-accessible modal with Email, country calling code / Mobile / WhatsApp, Name, Company name, and Message. Email, Name and Message are required. The optional country code supports suggested values and manual entry.
- The header quote button and product inquiry buttons open the same form. Product buttons prefill the message; the server resolves the published product name and SKU from the source path.
- Successful submissions are persisted before showing confirmation. Failed submissions preserve the customer's inputs. Retrying a submission uses the same UUID and does not create another record.
- The form displays the requested response-time copy: within 24 hours / one business day. The sales team must handle these responses.

## Admin flow

`/admin/inquiries` requires an active administrator session. It provides newest-first pagination (20 per page), text search and status filters. `/admin/inquiries/[id]` shows the complete submission, source page and product snapshot, and supports internal notes and New / Contacted / Closed / Spam statuses. The dashboard shows the new-inquiry count.

Updates check `updatedAt` to prevent overwriting another administrator's changes. Customer-submitted fields remain as received; internal notes and status are editable. Mark unwanted inquiries as Spam to retain a record without adding permanent deletion to the workflow.

Email and WhatsApp links open the corresponding external application. Submitting a form or saving follow-up notes does **not** send emails or WhatsApp messages. There is no automatic notification integration in this implementation.

## Data and controls

Migration: `prisma/migrations/20260906090000_customer_inquiries/migration.sql`. It adds only the Inquiry table, InquiryStatus enum, and indexes. It does not modify existing catalog data.

The public API only supports POST. It enforces field limits, a 16 KiB body limit, JSON content type, same-origin browser requests, a honeypot, and a database-backed limit of five submissions per email per hour. An advisory transaction lock enforces the limit across workers. This is basic spam protection; it is not a CAPTCHA or a network-level abuse filter.

The database stores no IP addresses and the source path excludes query strings. Error responses and submission-failure logs contain no customer contact details. Production reverse proxies must preserve the original host and scheme for the origin check.

## Release

Generate the client with `npm run db:generate`. After approval for the target database, apply migrations with `npm run db:deploy` before starting the new application version. Then build with `npm run build` and restart using the deployment's usual process. Verify a real approved submission and admin follow-up on that environment before calling the production rollout complete.

Do not run migration development/reset commands against production. Local QA uses a separate PostgreSQL instance and a database named `glarivo_inquiry_test`; its synthetic records are unrelated to production.

## Regression checks

- `npx tsx --test src/lib/inquiries.test.ts` checks required fields, optional contact data, limits, phone prefix rules, source paths and honeypot rejection.
- `scripts/test-inquiries.ts` checks a running local API for persistence, concurrent retry deduplication, rate limiting, invalid requests and unauthenticated admin access. It requires a local DATABASE_URL whose database ends in `_test` and a local INQUIRY_TEST_BASE_URL. It deletes only records created under its unique test email.
- Browser acceptance: homepage rail contacts, form submission and success, keyboard close/focus return, mobile scrolling, product context, admin login/list/detail/search/status/notes persistence, and a failed submission that preserves data.

### Verified locally on 2026-09-06

All four validation tests and the local API integration checks passed. Playwright verified actual submissions and authenticated admin follow-up, including save/reload, repeated status changes, search/filter, product name/SKU persistence, failure/retry behavior, Escape/focus restoration, and a scrollable mobile modal with the background locked. Screenshots were inspected at desktop 1440×1000 and mobile 390×844 and are under `output/playwright/inquiry-*.png` (ignored local artifacts).

TypeScript and ESLint on the changed application files passed. Repository-wide ESLint still reports pre-existing CommonJS errors in `output/imagegen/exhibitions-v2/save-assets.cjs` and `output/imagegen/exhibitions-v3/save-assets.cjs`, plus warnings in earlier browser-check scripts.

The production build (`npm run build -- --webpack`) also passed in an isolated copy using the local test database, including TypeScript, page generation and build traces. Webpack was used for this Windows verification; the default Turbopack build was not rerun.

Read-only remote migration status showed exactly one pending migration: `20260906090000_customer_inquiries`. It has only been applied to the isolated local test database. Production data has not been changed, and no deployment or Git push has been performed.
