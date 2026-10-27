# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-10-26

- Documented the approved six-tier pricing lineup (`PREMIUMM15`, `PREMIUMX1`, `PREMIUMX3`, `PREMIUMD1`, `PREMIUMD7`, `PREMIUMD30`) in the README. No payment-logic changes were needed: plan IDs and prices are already fetched live from the backend and were never hardcoded in this client.
- Documented SOCKS5 proxy access: every plan now bundles an HTTP proxy and a SOCKS5 proxy. `list_vpn_catalog` now surfaces each plan's `services` and `port` fields from the backend's discovery manifest; tool descriptions for `list_vpn_catalog`, `buy_vpn`, and `fulfill_payment` mention the `socks5_port`/`socks5_connection_string` credential fields. Added a README Credentials section with a curl usage example.
- Added `proxy` and `socks5` keywords to `package.json` for discoverability.
- Added tests confirming `list_vpn_catalog` and `buy_vpn` already handle plan identifiers beyond the original two, and the new `services`/`port` discovery fields, without any client-side allowlist.
- Updated dependencies: `@modelcontextprotocol/sdk`, `viem`, `@types/node` (patch/minor). Updated `zod` to v4, with a matching fix to the `PaymentAccept.extra` schema for the v4 `z.record()` signature change. Updated `vitest` (dev-only) to v5, resolving a previously tracked `@vitest/mocker` path-traversal advisory.

## [1.0.0] - 2026-09-22

- Initial public release with five tools: `wallet_status`, `list_vpn_catalog`, `buy_vpn`, `fulfill_payment`, `sign_and_pay`.
- Support for signing and paying USDC on Solana (SPL transfer) and EVM (EIP-3009 `transferWithAuthorization`).
- Recovery flow via `fulfill_payment` for exchanging an already-broadcast payment for VPN credentials when fulfillment fails after payment.
- `dry_run` support on `buy_vpn` and `sign_and_pay` for balance checks without broadcasting a transaction.
