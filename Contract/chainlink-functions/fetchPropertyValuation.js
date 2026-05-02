const propertyId = args[0];
if (!propertyId) {
  throw Error("Missing propertyId argument");
}
const apiKey = secrets.REALTYMOLE_API_KEY;
if (!apiKey) {
  throw Error("Missing REALTYMOLE_API_KEY in secrets");
}
const propertyResponse = await Functions.makeHttpRequest({
  url: `https://realty-mole-property-api.p.rapidapi.com/properties/${encodeURIComponent(propertyId)}`,
  headers: {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "realty-mole-property-api.p.rapidapi.com",
  },
  method: "GET",
  timeout: 9000,
});
if (propertyResponse.error) {
  throw Error(`RealtyMole API error: ${propertyResponse.error}`);
}
const property = propertyResponse.data;
const estimatedValueUSD = property.estimatedValue;
if (!estimatedValueUSD || typeof estimatedValueUSD !== "number" || estimatedValueUSD <= 0) {
  throw Error(`Invalid estimatedValue: ${estimatedValueUSD}`);
}
const valuationCents = Math.round(estimatedValueUSD * 100);
console.log(`Property ${propertyId}: $${estimatedValueUSD} USD → ${valuationCents} cents`);
return Functions.encodeUint256(valuationCents);