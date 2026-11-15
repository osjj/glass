# Glarivo inquiry analytics

Approved scope: implement the website changes requested in this chat; leave GA4 configuration and deployment untouched.

## Design

- Reuse the existing G-ZN5MYTQSBP tag. Load it only in production on glarivoglass.com or www.glarivoglass.com, after hydration; preserve enhanced page-view measurement.
- Send generate_lead only after the inquiry API confirms a saved inquiry. Deduplicate by the existing submissionId. Tracking failure must never change a successful inquiry into an error.
- Send contact_click from explicitly identified sales email, telephone and WhatsApp links, with method and header/rail/footer location. Keep navigation intact. Opening the WhatsApp chooser and sharing a product by email do not count.
- Send only form identifier, lead type, safe source path and optional product slug, or contact method/location. Never include submitted contact details or message text. Ignore business events on admin routes.
- Exercise the real client submission boundary with fake HTTP responses and a captured gtag transport; never create real inquiries, email or analytics traffic during tests.

## Approach

Use a small analytics helper and a shared ContactLink client component. Explicit links keep the footer server-rendered and avoid accidentally counting email sharing; a document-wide link classifier is unnecessary. Extract the existing client HTTP submission into a small function so response failures, retries and analytics failures can be verified without a live API.

## Acceptance

One accepted submission emits one lead event; failed requests emit none. The same accepted submission is not counted twice. Nonofficial hosts and development render no Google tag and send no business events. Contact links still navigate when analytics is absent or throws. No GA4 settings, deployment, or real form submission is performed.
