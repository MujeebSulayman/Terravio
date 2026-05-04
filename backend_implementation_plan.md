# Terravio Backend Implementation Plan

This document outlines the architecture, technology stack, and step-by-step implementation strategy for the Terravio backend.

## 0. Current state (repo)

*   **`/Backend`:** Not implemented yet — only an empty placeholder; no `package.json`, Express app, or Prisma schema checked in.
*   **Contracts (source of truth):** `Contract/deployment-output/baseSepolia_addresses.json` holds deployed addresses on Base Sepolia (`chainId` **84532**): `AssetRegistry`, `GoldToken`, `PropertyToken`, `CarbonToken`.
*   **Chainlink Functions:** `Contract/chainlink-functions/fetchCarbonData.js` still uses **mock** `creditData` locally; the real Terravio HTTP call is **commented out** and expects `Authorization: Bearer ${secrets.TERRAVIO_API_KEY}`. Property valuations use **RentCast** inside the function script (`fetchPropertyValuation.js`), not the Terravio backend today.

---

## 1. Architecture & Technology Stack

To build a robust, scalable, and Web3-ready backend, we will use the following stack:

*   **Runtime & Framework:** Node.js + Express.js (written in TypeScript for type safety).
*   **Database:** PostgreSQL managed via Prisma ORM.
*   **Web3 Integration:** `ethers.js` v6 (Base Sepolia RPC, contract ABIs from the `Contract` artifacts or a copied minimal ABI).
*   **Authentication:** `@privy-io/server-auth` (to validate frontend JWTs).
*   **KYC Provider:** Didit API (for identity verification and webhooks).

---

## 2. Core Responsibilities

The backend will serve three primary functions:
1.  **The Oracle API:** Serve real-time asset data (carbon credit active status and quantity) to Chainlink Functions — matching the payload shape already assumed in `fetchCarbonData.js`.
2.  **Auth & Identity:** Validate Privy users and resolve their **embedded / linked wallet** address server-side (store or derive consistently with the frontend).
3.  **The KYC Gatekeeper:** On Didit approval, produce **EIP-712 signed** whitelist approvals and submit on-chain `whitelistInvestor` transactions (see §3.1 — **not** a simple `whitelist(address)` helper).

---

## 3. Contract alignment (must match on-chain code)

### 3.1 KYC / whitelist — EIP-712, not `whitelist(wallet)`

`BaseRWAToken` exposes `whitelistInvestor(RWALib.WhitelistApproval calldata approval)`. It verifies an **EIP-712** signature from the **`kycManager`** address over:

*   Struct: `WhitelistApproval(address investor,uint256 deadline)` (`RWALib.WHITELIST_TYPEHASH`).

Each RWA token is a **separate contract** with its **own** whitelist mapping. After KYC, the backend typically must:

1.  For each token the product should unlock (e.g. Gold, Property, Carbon), build the **correct EIP-712 domain** for that contract:
    *   **name:** must match `__EIP712_init` — respectively `"Terravio Gold"`, `"Terravio Property"`, `"Terravio Carbon"` (see token `initialize` in `Contract/contracts/tokens/*.sol`).
    *   **version:** `"1"` (`RWALib.PROTOCOL_VERSION`).
    *   **chainId:** `84532` on Base Sepolia.
    *   **verifyingContract:** that token’s proxy address from deployment output.
2.  Sign `investor` + `deadline` with the **`kycManager` private key** (same account as Hardhat `kycManager` at deploy).
3.  Call `whitelistInvestor({ investor, deadline, signature })` on each relevant token (sequential or batched txs), handling **nonce, gas, and failures** (partial success = operational concern).

`DEFAULT_ADMIN_ROLE` may also `batchWhitelist` — that is admin-only and **not** the KYCManager signature path; the plan assumes the **kycManager signature** flow for user-driven KYC.

### 3.2 Oracle HTTP contract (carbon)

When uncommented, `fetchCarbonData.js` expects a **GET** to your API with Bearer `TERRAVIO_API_KEY` and JSON usable as:

*   `creditData.status` — must be `"ACTIVE"` or the function returns zero.
*   `creditData.quantity` — optional; falls back to the Functions arg tonnes.

Define this as a **stable, versioned JSON schema**; keep the Chainlink script and backend in lockstep.

### 3.3 Property / gold

*   **Property:** Valuation is currently **RentCast → Chainlink**; add a backend endpoint only if you want centralized metadata, auditing, or to replace/supplement RentCast later.
*   **Gold:** Valuation uses on-chain Chainlink **price feed** in `GoldToken` — no Terravio HTTP oracle required for price.

---

## 4. Implementation Phases

### Phase 1: Project Setup & Database Design
*   Initialize the Node.js/TypeScript project in the `/Backend` directory (the commands at the end of this doc are a starting point; add `prisma` CLI usage and scripts as needed).
*   Set up Express, centralized error handling, request logging, and environment validation (e.g. `zod` or `envalid`).
*   Initialize Prisma and design the schema, including ideas below:
    *   **User:** Privy subject ID, email (if available), primary wallet address, KYC status enum, timestamps.
    *   **KycWebhookEvent (recommended):** Didit event id, payload hash, processed flag — for **idempotency** and audits.
    *   **WhitelistSubmission (recommended):** user/wallet, token contract address, tx hash, status — avoid double-submitting on webhook retries.
    *   **Asset (optional):** Off-chain metadata keyed by on-chain asset / IPFS CID (images, certificates, human-readable copy).

### Phase 2: Security & Authentication
*   Install and configure the Privy Server SDK.
*   Create `authMiddleware` for protected routes: verify Privy JWT, attach `userId` and resolved **wallet** to `req`.
*   Add **CORS** allowlist for your frontend origin(s).

### Phase 3: The Chainlink Oracle Endpoints
*   Build authenticated endpoints the DON will call (same semantics as §3.2).
*   Implement **`GET /api/carbon/:id/status`** (or the exact path already referenced in `fetchCarbonData.js` when uncommented — keep paths identical).
*   **API key middleware:** shared secret `TERRAVIO_API_KEY` (header or Bearer — match the Functions script). Rotate keys and store in Chainlink Functions **secrets**.
*   Optional: **`GET /health`** / **`GET /ready`** (DB connectivity) for orchestration — not for Chainlink.

### Phase 4: Didit KYC & Blockchain Integration
*   **`POST /api/kyc/didit-webhook`:** Parse Didit events; **verify webhook authenticity** (per Didit docs — signatures or shared secret).
*   **Idempotency:** Ignore duplicate deliveries using stored event IDs or dedupe keys.
*   On **approved** KYC: resolve user wallet from DB / Privy mapping; sign EIP-712 approvals per §3.1; **`kycManager` wallet** submits `whitelistInvestor` on each configured RWA address.
*   Persist tx hashes and surface errors (alerting / dead-letter) if chain submission fails after KYC approval.

### Phase 5: Frontend Integration APIs
*   **`GET /api/users/me`:** Auth’d profile + KYC status + optional per-token whitelist flags (via `ethers.staticCall` or indexer later).
*   Endpoints for **off-chain asset details** (large media, documents) keyed by registry / token / IPFS CID as needed.
*   Optional: **`POST /api/kyc/whitelist-proof`** returning a signed `WhitelistApproval` for **client-submitted** txs — only if you want users to pay gas; default is backend-broadcast.

---

## 5. System gaps to close (beyond the original outline)

| Area | Gap |
|------|-----|
| **Monorepo** | No backend code; npm scripts, lint/format, and CI not wired for `/Backend`. |
| **Env/config** | Document and validate: `DATABASE_URL`, Privy credentials, Didit webhook secret, `TERRAVIO_API_KEY`, Base RPC URL, all RWA token addresses, `kycManager` key handling (dev vs KMS/HSM in prod). |
| **Chainlink** | Uncomment and test live HTTP path in `fetchCarbonData.js`; register `TERRAVIO_API_KEY` in Functions secrets; confirm timeout and URL match production. |
| **KYC correctness** | Plan must use **EIP-712 + `whitelistInvestor`** and **per-token domains** — see §3.1. |
| **Multi-token** | Whitelist is **per token contract**; define product rule: all three tokens vs subset. |
| **Webhook safety** | Signature verification, replay/idempotency, rate limit webhook route. |
| **Reliability** | Tx queue or retry policy for failed `whitelistInvestor`; monitoring/alerts. |
| **Observability** | Structured logs (no secrets), correlation IDs, optional OpenTelemetry. |
| **Testing** | Unit tests for signing domain construction; contract interaction mocks; webhook integration tests. |
| **Production hardening** | Rate limiting on public routes, helmet/cors, dependency audit, `kycManager` key never in logs. |

---

## 6. Next Steps to Begin

To kick off Phase 1, initialize the project.

Run the following commands in your terminal to create the folder and set up the foundation:

```bash
mkdir -p ../Backend
cd ../Backend
npm init -y
npm install express dotenv cors ethers @privy-io/server-auth
npm install --save-dev typescript @types/node @types/express ts-node nodemon prisma
npx tsc --init
npx prisma init
```

After scaffolding, copy or generate **minimal ABIs** for `whitelistInvestor` (and any read helpers) from `Contract/artifacts` or Hardhat `deployments` JSON so the backend stays aligned with deployed bytecode.
