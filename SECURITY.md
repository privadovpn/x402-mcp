# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Report suspected vulnerabilities privately to **security@privadovpn.com** (placeholder — confirm before publishing). Do not open a public issue for a suspected vulnerability.

Include, where possible: a description of the issue, steps to reproduce, affected version, and potential impact.

## Scope

In scope:

- Private key handling and local signing logic (`src/chains/`, `src/config.ts`)
- Payment authorization construction (`src/payment_signature.ts`)
- Double-payment or duplicate-invoice conditions in `buy_vpn` / `fulfill_payment`
- Any way to bypass network selection or force payment on an unintended chain

Out of scope:

- The x402 backend service at `x402.privadovpn.com` (has its own reporting process)
- Vulnerabilities in third-party dependencies without a demonstrated impact on this package (report upstream and open an issue here for tracking)

## Disclosure timeline

We aim to acknowledge reports within 5 business days and provide a resolution timeline within 10 business days. Coordinated disclosure is preferred; please allow a reasonable period for a fix to ship before public disclosure.
