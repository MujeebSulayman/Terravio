require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 1. Mock the Chainlink Functions Environment
const Functions = {
  makeHttpRequest: async (config) => {
    try {
      const response = await axios(config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      if (error.response) {
        return {
          error: `HTTP error ${error.response.status}`,
          status: error.response.status,
          data: error.response.data,
        };
      }
      return {
        error: error.message,
      };
    }
  },
  encodeUint256: (number) => {
    console.log(`[Mock Encode] Value to be sent on-chain: ${number}`);
    return `0xEncodedValue(${number})`;
  },
};

// 2. Set up arguments and secrets
const args = ["VCS-191-AMAZON-REDD", "5000"]; // carbonTokenId and quantityTonnes from deploy.js
const secrets = {
  TERRAVIO_API_KEY: process.env.TERRAVIO_API_KEY,
};

// 3. Read the source code
const sourcePath = path.join(__dirname, "fetchCarbonData.js");
const sourceCode = fs.readFileSync(sourcePath, "utf8");

// 4. Run the code locally
async function runTest() {
  console.log("--- Starting Local Carbon Data Test ---");
  console.log(`Testing with token ID: ${args[0]} | Quantity: ${args[1]}`);

  if (!secrets.TERRAVIO_API_KEY || secrets.TERRAVIO_API_KEY.includes("your_")) {
    console.warn("⚠️ WARNING: TERRAVIO_API_KEY in .env seems to be missing or is a placeholder!");
  }

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  
  try {
    const executable = new AsyncFunction("args", "secrets", "Functions", sourceCode);
    const result = await executable(args, secrets, Functions);
    
    console.log("--- Test Completed Successfully ---");
    console.log("Script Return Value:", result);
  } catch (error) {
    console.error("--- Test Failed ---");
    console.error("Error from script:", error.message);
  }
}

runTest();
