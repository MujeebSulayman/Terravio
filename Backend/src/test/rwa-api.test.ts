import axios from "axios";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const BASE_URL = "http://localhost:3001";
const API_KEY = process.env.TERRAVIO_API_KEY;

async function runTests() {
  console.log("🚀 Starting RWA Backend API Tests (No Mocks)...");

  // 1. Test Protocol Assets
  try {
    console.log("\n--- Testing: GET /api/protocol/assets ---");
    const res = await axios.get(`${BASE_URL}/api/protocol/assets`);
    console.log("✅ Success!");
    console.log(`Found ${res.data.data?.length || 0} assets in DB.`);
  } catch (err: any) {
    console.error("❌ Failed /api/protocol/assets:", err.response?.status, err.response?.data || err.message);
  }

  // 2. Test Protocol Health (On-chain)
  try {
    console.log("\n--- Testing: GET /api/protocol/health ---");
    const res = await axios.get(`${BASE_URL}/api/protocol/health`);
    console.log("✅ Success!");
    console.log("On-chain health data:");
    console.log(JSON.stringify(res.data.data, null, 2));
  } catch (err: any) {
    console.error("❌ Failed /api/protocol/health:", err.response?.status, err.response?.data || err.message);
  }

  // 3. Test Carbon Oracle (with API Key)
  try {
    const carbonId = "VCS-191-AMAZON-REDD";
    console.log(`\n--- Testing: GET /api/carbon/${carbonId}/status ---`);
    const res = await axios.get(`${BASE_URL}/api/carbon/${carbonId}/status`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });
    console.log("✅ Success!");
    console.log("Carbon Status:", res.data);
  } catch (err: any) {
    console.error(`❌ Failed /api/carbon/status:`, err.response?.status, err.response?.data || err.message);
  }

  console.log("\n🏁 All tests completed.");
}

runTests();
