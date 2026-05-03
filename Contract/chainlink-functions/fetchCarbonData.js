const carbonTokenId = args[0];
const quantityTonnes = parseInt(args[1] || "1000");
if (!carbonTokenId) {
  throw Error("Missing carbonTokenId argument");
}
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
let pricePerTonneUSD = 14.0;
if (!climateResponse.error && climateResponse.data?.data?.pair?.token1Price) {
  pricePerTonneUSD = parseFloat(climateResponse.data.data.pair.token1Price);
}
const statusResponse = await Functions.makeHttpRequest({
  url: `https://api.nexusrwa.com/carbon/${carbonTokenId}/status`,
  headers: {
    "Authorization": `Bearer ${secrets.TERRAVIO_API_KEY}`,
    "Content-Type": "application/json",
  },
  method: "GET",
  timeout: 9000,
});
if (statusResponse.error) {
  throw Error(`Backend API error: ${statusResponse.error}`);
}
const creditData = statusResponse.data;
if (creditData.status !== "ACTIVE") {
  return Functions.encodeUint256(0);
}
const tonnes = creditData.quantity || quantityTonnes;
const totalValueUSD = pricePerTonneUSD * tonnes;
const valuationCents = Math.round(totalValueUSD * 100);
console.log(
  `Carbon ${carbonTokenId}: $${pricePerTonneUSD}/tonne × ${tonnes} tonnes = $${totalValueUSD}`
);
return Functions.encodeUint256(valuationCents);