export const BaseRWATokenABI = [
  {
    type: "function",
    name: "getAssetMetadata",
    inputs: [],
    outputs: [
      {
        components: [
          { name: "assetType", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "ipfsCID", type: "string" },
          { name: "valuationUSD", type: "uint256" },
          { name: "yieldBPS", type: "uint256" },
          { name: "lastUpdated", type: "uint64" },
          { name: "totalIssuance", type: "uint256" }
        ],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "claimableYield",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "claimYield",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "isWhitelisted",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  }
] as const;
