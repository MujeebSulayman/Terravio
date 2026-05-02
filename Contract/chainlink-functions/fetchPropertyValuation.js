/**
 * fetchPropertyValuation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NexusRWA — Chainlink Functions Script: Property Valuation
 *
 * WHAT THIS FILE IS:
 *   This JavaScript runs INSIDE the Chainlink Decentralized Oracle Network (DON).
 *   It is NOT Node.js on your server. It runs in a sandboxed environment provided
 *   by Chainlink with access to a limited set of APIs.
 *
 * HOW IT GETS CALLED:
 *   1. PropertyToken.requestValuationUpdate() is called on-chain
 *   2. Chainlink DON picks up the request and executes this script
 *   3. args[0] = propertyId (passed from the smart contract)
 *   4. This script fetches the RealtyMole API and returns the valuation
 *   5. The DON calls PropertyToken.fulfillRequest() with the encoded result
 *
 * AVAILABLE IN CHAINLINK DON SANDBOX:
 *   - Functions.makeHttpRequest()  ← HTTP fetch (no fetch() or axios)
 *   - args[]                       ← Arguments passed from smart contract
 *   - secrets{}                    ← Encrypted secrets (API keys) stored in DON
 *   - ethers (limited subset)
 *   - NO: fs, process, require, Buffer (Node.js APIs unavailable)
 *
 * RETURN VALUE:
 *   Must return a Buffer (bytes) — we return ABI-encoded uint256 (valuation in USD cents)
 *   The smart contract decodes this and converts to 18 decimals.
 *
 * SETUP REQUIRED:
 *   1. Create a Chainlink Functions subscription at https://functions.chain.link
 *   2. Fund subscription with LINK tokens
 *   3. Add PropertyToken contract address as a consumer
 *   4. Store your RealtyMole API key as an encrypted secret in the DON:
 *      npx @chainlink/functions-toolkit uploadSecrets \
 *        --secrets '{"REALTYMOLE_API_KEY": "your_key_here"}' \
 *        --slotId 0 --expirationTimeMinutes 4320
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Step 1: Get the property ID passed from the smart contract ────────────────
const propertyId = args[0];

if (!propertyId) {
  throw Error("Missing propertyId argument");
}

// ── Step 2: Fetch property valuation from RealtyMole API ─────────────────────
// RealtyMole API docs: https://rapidapi.com/realty-mole-realty-mole-default/api/realty-mole-property-api

const apiKey = secrets.REALTYMOLE_API_KEY;

if (!apiKey) {
  throw Error("Missing REALTYMOLE_API_KEY in secrets");
}

// RealtyMole: GET /properties/{propertyId}
// Returns property details including estimatedValue
const propertyResponse = await Functions.makeHttpRequest({
  url: `https://realty-mole-property-api.p.rapidapi.com/properties/${encodeURIComponent(propertyId)}`,
  headers: {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "realty-mole-property-api.p.rapidapi.com",
  },
  method: "GET",
  timeout: 9000, // Chainlink Functions has a 10s timeout
});

if (propertyResponse.error) {
  throw Error(`RealtyMole API error: ${propertyResponse.error}`);
}

const property = propertyResponse.data;

// ── Step 3: Extract valuation ─────────────────────────────────────────────────
// RealtyMole returns estimatedValue in USD as a number e.g. 485000
// We convert to cents (multiply by 100) to avoid floats

const estimatedValueUSD = property.estimatedValue;

if (!estimatedValueUSD || typeof estimatedValueUSD !== "number" || estimatedValueUSD <= 0) {
  throw Error(`Invalid estimatedValue: ${estimatedValueUSD}`);
}

// Convert to cents (integer, no decimals)
const valuationCents = Math.round(estimatedValueUSD * 100);

console.log(`Property ${propertyId}: $${estimatedValueUSD} USD → ${valuationCents} cents`);

// ── Step 4: Encode and return ─────────────────────────────────────────────────
// Return as ABI-encoded uint256 (big-endian 32 bytes)
// The smart contract decodes this with: abi.decode(response, (uint256))

return Functions.encodeUint256(valuationCents);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ALTERNATIVE DATA SOURCES (swap in above if needed):
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Option B: Your own NexusRWA backend API
 * ─────────────────────────────────────────
 * const backendResponse = await Functions.makeHttpRequest({
 *   url: `https://api.nexusrwa.com/property/${propertyId}/valuation`,
 *   headers: { "Authorization": `Bearer ${secrets.NEXUSRWA_API_KEY}` },
 *   method: "GET",
 * });
 * const valuationCents = Math.round(backendResponse.data.valuationUSD * 100);
 * return Functions.encodeUint256(valuationCents);
 *
 * Option C: Zillow / Zestimate (requires partner access)
 * ─────────────────────────────────────────────────────
 * const zillowResponse = await Functions.makeHttpRequest({
 *   url: `https://api.bridgedataoutput.com/api/v2/zestimates/${propertyId}`,
 *   headers: { "Authorization": `Bearer ${secrets.ZILLOW_API_KEY}` },
 * });
 * const zestimate = zillowResponse.data.bundle[0].zestimate;
 * return Functions.encodeUint256(Math.round(zestimate * 100));
 *
 * Option D: Aggregate median from 2 sources (more robust)
 * ────────────────────────────────────────────────────────
 * const [r1, r2] = await Promise.all([
 *   Functions.makeHttpRequest({ url: source1 }),
 *   Functions.makeHttpRequest({ url: source2 }),
 * ]);
 * const median = Math.round((r1.data.value + r2.data.value) / 2 * 100);
 * return Functions.encodeUint256(median);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
