# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-09-22

- Initial public release with five tools: `wallet_status`, `list_vpn_catalog`, `buy_vpn`, `fulfill_payment`, `sign_and_pay`.
- Support for signing and paying USDC on Solana (SPL transfer) and EVM (EIP-3009 `transferWithAuthorization`).
- Recovery flow via `fulfill_payment` for exchanging an already-broadcast payment for VPN credentials when fulfillment fails after payment.
- `dry_run` support on `buy_vpn` and `sign_and_pay` for balance checks without broadcasting a transaction.
