/**
 * fetchCarbonData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NexusRWA — Chainlink Functions Script: Carbon Credit Valuation
 *
 * FLOW:
 *   args[0] = carbonTokenId (the registry batch ID or serial number)
 *
 * This script fetches:
 *   1. Carbon credit price (USD per tonne) from Toucan/KlimaDAO price API
 *   2. Credit status from your NexusRWA backend (which mirrors Verra registry)
 *
 * RETURN:
 *   ABI-encoded uint256 — total valuation in USD cents
 *   (price per tonne × number of tonnes × 100)
 *
 * SECRETS NEEDED:
 *   secrets.NEXUSRWA_API_KEY — your backend API key
 * ─────────────────────────────────────────────────────────────────────────────
 */

const carbonTokenId = args[0];
const quantityTonnes = parseInt(args[1] || "1000"); // tonnes in this batch

if (!carbonTokenId) {
  throw Error("Missing carbonTokenId argument");
}

// ── Step 1: Get carbon credit price from KlimaDAO API ────────────────────────
// KlimaDAO indexes tokenized carbon credit prices (BCT, NCT, MCO2)
// This is publicly accessible — no API key needed

const climateResponse = await Functions.makeHttpRequest({
  url: "https://api.thegraph.com/subgraphs/name/klimadao/klimadao-polygon",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  data: JSON.stringify({
    query: `{
      pair(id: "0x9803c7ae526049210a1725f7487af26fe2c24614") {
        token1Price
      }
    }`,
  }),
  timeout: 9000,
});

let pricePerTonneUSD = 14.0; // fallback price in USD

if (!climateResponse.error && climateResponse.data?.data?.pair?.token1Price) {
  pricePerTonneUSD = parseFloat(climateResponse.data.data.pair.token1Price);
}

// ── Step 2: Verify credit status from NexusRWA backend ───────────────────────
// Your backend aggregates Verra registry data and caches it
// Returns: { status: "ACTIVE" | "RETIRED", vintage: 2022, quantity: 1000 }

const statusResponse = await Functions.makeHttpRequest({
  url: `https://api.nexusrwa.com/carbon/${carbonTokenId}/status`,
  headers: {
    "Authorization": `Bearer ${secrets.NEXUSRWA_API_KEY}`,
    "Content-Type": "application/json",
  },
  method: "GET",
  timeout: 9000,
});

if (statusResponse.error) {
  throw Error(`Backend API error: ${statusResponse.error}`);
}

const creditData = statusResponse.data;

// Only active (non-retired) credits have value
if (creditData.status !== "ACTIVE") {
  // Return 0 for retired credits — contract handles this
  return Functions.encodeUint256(0);
}

// Use quantity from registry if available, else use passed arg
const tonnes = creditData.quantity || quantityTonnes;

// ── Step 3: Calculate total valuation ────────────────────────────────────────
const totalValueUSD = pricePerTonneUSD * tonnes;
const valuationCents = Math.round(totalValueUSD * 100);

console.log(
  `Carbon ${carbonTokenId}: $${pricePerTonneUSD}/tonne × ${tonnes} tonnes = $${totalValueUSD}`
);

return Functions.encodeUint256(valuationCents);
