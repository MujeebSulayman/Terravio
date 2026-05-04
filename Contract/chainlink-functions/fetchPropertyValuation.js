const propertyId = args[0];
if (!propertyId) {
  throw Error("Missing propertyId argument");
}
const backendBaseUrl = secrets.TERRAVIO_BACKEND_BASE_URL;
if (!backendBaseUrl) {
  throw Error("Missing TERRAVIO_BACKEND_BASE_URL in secrets");
}
const apiKey = secrets.TERRAVIO_API_KEY;
if (!apiKey) {
  throw Error("Missing TERRAVIO_API_KEY in secrets");
}

const propertyResponse = await Functions.makeHttpRequest({
  url: `${backendBaseUrl.replace(/\/$/, "")}/api/property/${encodeURIComponent(propertyId)}/valuation`,
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  method: "GET",
  timeout: 9000,
});

if (propertyResponse.error) {
  throw Error(`Backend API error: ${propertyResponse.error}`);
}

const property = propertyResponse.data;
const estimatedValueUSD = property.estimatedValueUSD;

if (!estimatedValueUSD || typeof estimatedValueUSD !== "number" || estimatedValueUSD <= 0) {
  throw Error(`Invalid estimatedValue: ${estimatedValueUSD}`);
}

const valuationCents = Math.round(estimatedValueUSD * 100);
console.log(`Property ${propertyId}: $${estimatedValueUSD} USD → ${valuationCents} cents`);
return Functions.encodeUint256(valuationCents);