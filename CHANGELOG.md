# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.1.0] - 2026-10-26

- `list_vpn_catalog` returns each plan's `services` and `port` from the live discovery manifest, so every plan shows the protocols it includes (HTTP proxy and SOCKS5).
- Documented the approved six-tier pricing lineup (`PREMIUMM15`, `PREMIUMX1`, `PREMIUMX3`, `PREMIUMD1`, `PREMIUMD7`, `PREMIUMD30`). Plan IDs and prices stay fetched live from the backend.
- Tool descriptions for `list_vpn_catalog`, `buy_vpn`, and `fulfill_payment` mention `socks5_port` and `socks5_connection_string`. Added a README Credentials section with a curl usage example.
- Added `proxy` and `socks5` keywords to `package.json` for discoverability.

## [1.0.0] - 2026-09-22

- Initial public release with five tools: `wallet_status`, `list_vpn_catalog`, `buy_vpn`, `fulfill_payment`, `sign_and_pay`.
- Support for signing and paying USDC on Solana (SPL transfer) and EVM (EIP-3009 `transferWithAuthorization`).
- Recovery flow via `fulfill_payment` for exchanging an already-broadcast payment for VPN credentials when fulfillment fails after payment.
- `dry_run` support on `buy_vpn` and `sign_and_pay` for balance checks without broadcasting a transaction.
