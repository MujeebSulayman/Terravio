const propertyId = args[0];
if (!propertyId) {
  throw Error("Missing propertyId argument");
}
const apiKey = secrets.RENTCAST_API_KEY;
if (!apiKey) {
  throw Error("Missing RENTCAST_API_KEY in secrets");
}

// Convert dashes back to spaces for RentCast address format
const addressQuery = propertyId.replace(/-/g, ' ');

const propertyResponse = await Functions.makeHttpRequest({
  url: `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(addressQuery)}`,
  headers: {
    "accept": "application/json",
    "X-Api-Key": apiKey,
  },
  method: "GET",
  timeout: 9000,
});

if (propertyResponse.error) {
  throw Error(`RentCast API error: ${propertyResponse.error}`);
}

const property = propertyResponse.data;
const estimatedValueUSD = property.price; // RentCast uses .price

if (!estimatedValueUSD || typeof estimatedValueUSD !== "number" || estimatedValueUSD <= 0) {
  throw Error(`Invalid estimatedValue: ${estimatedValueUSD}`);
}

const valuationCents = Math.round(estimatedValueUSD * 100);
console.log(`Property ${addressQuery}: $${estimatedValueUSD} USD → ${valuationCents} cents`);
return Functions.encodeUint256(valuationCents);