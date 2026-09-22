# Contributing

## Development setup

```bash
git clone git@github.com:privadovpn/x402-mcp.git
cd x402-mcp
npm install
npm run build
npm test
```

Run the server locally against the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Branches and pull requests

- Branch from `main`, open a pull request back into `main`.
- Keep pull requests focused on a single change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- Run `npm test` and `npm run build` before opening a pull request; both must pass.

## Review requirements

Changes touching payment signing, network selection, or invoice/fulfillment logic (`src/chains/`, `src/payment_signature.ts`, `src/tools/buy_vpn.ts`, `src/tools/sign_and_pay.ts`, `src/tools/fulfill_payment.ts`) require maintainer review before merge, regardless of test coverage.
