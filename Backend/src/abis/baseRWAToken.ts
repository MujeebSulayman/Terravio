/** Minimal ABI for whitelistInvestor(tuple) on BaseRWAToken. */
export const BASE_RWA_WHITELIST_ABI = [
  {
    name: "whitelistInvestor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "approval",
        type: "tuple",
        components: [
          { name: "investor", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "isWhitelisted",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
