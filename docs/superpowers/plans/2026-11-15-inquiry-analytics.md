# Inquiry analytics implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement the approved scope; delegated contact-link wiring is independent of the analytics helper.

**Goal:** Implement local website analytics for accepted inquiries and sales contact intent without sending development or nonofficial-host traffic.

**Architecture:** A typed analytics helper owns host/environment guards, parameter selection and lead deduplication. A shared ContactLink wraps explicit sales links. The existing inquiry API client calls analytics after a successful response; the modal retains its validation and UI behavior.

**Tech stack:** Next.js 16.3, React 19, TypeScript, node:test through tsx; no new dependencies.

**Spec:** ../specs/2026-11-15-inquiry-analytics-design.md

## Constraints

- No GA4 configuration, deployment, live form submissions, database writes or email.
- Keep G-ZN5MYTQSBP and the existing inquiry API contract.
- Keep all form contact data out of analytics parameters.

## Review focus

- Official hostname spoofing, IP, localhost and preview hosts must fail closed.
- A failed or malformed API response must never count as a lead.
- Duplicate success responses and unavailable/throwing gtag must preserve business behavior.
- Keyboard/native link navigation and WhatsApp chooser behavior must remain intact.
- Source query strings and submitted personal details must never enter event parameters.

## Tasks

- [x] Write failing behavior tests for analytics guards, privacy, deduplication and ContactLink actions.
- [x] Implement src/lib/analytics.ts and src/components/site/contact-link.tsx; verify tests turn green.
- [x] Write failing submission-boundary tests; extract src/lib/inquiry-client.ts and wire the modal success path.
- [x] Gate google-analytics.tsx by the real browser hostname after hydration; wire only sales links in header, rail, WhatsApp and footer.
- [x] Run all repository tests, lint, typecheck and a local production build. Inspect the diff and obtain an independent review.
- [x] Report local changes, verification and any remaining limits. Leave everything uncommitted and undeployed for review.

## Verification record

- Baseline inquiry/email tests: 11 passed.
- Analytics/contact regression tests were observed failing before implementation, then passing. API client tests were observed failing against an empty implementation, then passing.
- `npm run test:analytics`: 29 passed; all discovered repository test files also passed with `tsx --test --test-concurrency=1`.
- `npm run typecheck` and `npm run build`: passed.
- Full ESLint: 159 errors and 61 warnings; every error is in pre-existing `output/` scripts. All changed/new code has zero ESLint errors and warnings. ESLint configuration was not changed.
- Independent whole-change review: no blocking findings.
- Local production browser: no Google scripts or requests after hydration on 127.0.0.1; mocked API failure displays an error and a successful retry with the same submissionId displays success. No live submission, email or analytics request was made.
- Browser keyboard activation opens the WhatsApp chooser and activates its sales link without the component preventing native navigation; the test intercepted the outgoing navigation before any external contact. Official-host Google script insertion remains covered by the host predicate tests and source review rather than a live GA request.
- Existing API response remains `{ success: true }`; no returned ID or server change is required because the saved client submissionId is already the API's idempotency key.
