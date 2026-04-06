export function getScriptTemplate(kind = "args") {
  if (kind === "payload") {
    return `import { Asset } from "@stellar/stellar-sdk";

payload = {
  assetCode: "USDC",
  issuerAddress: "GDUKMGUGDZQK6YH...",
  limit: "1000",
};`;
  }

  if (kind === "operations") {
    return `import * as StellarSdk from "@stellar/stellar-sdk";

operations = [
  {
    type: "changeTrust",
    label: "Change Trustline",
    values: {
      assetCode: "USDC",
      issuerAddress: "GDUKMGUGDZQK6YH...",
      limit: "1000",
    },
  },
  {
    type: "payment",
    label: "Payment",
    values: {
      assetCode: "USDC",
      issuerAddress: "GDUKMGUGDZQK6YH...",
      amount: "25",
      destination: "GA7ZYI5MRH7XGSUVMLXHOB3ZIHNMCCDYD2ABFUOUQMO56377LBPROAFG",
    },
  },
];`;
  }

  return `import * as StellarSdk from "@stellar/stellar-sdk";

const { nativeToScVal } = StellarSdk;

args = [
  nativeToScVal("GA7ZYI5MRH7XGSUVMLXHOB3ZIHNMCCDYD2ABFUOUQMO56377LBPROAFG", {
    type: "address",
  }),
  nativeToScVal("GC4O26MXQN72WX5SG7BOIV2N72RVDOLXN33BJFDJW3RS3FEBMRXPD56U", {
    type: "address",
  }),
  nativeToScVal(7220n, { type: "i128" }),
  nativeToScVal(13500000000n, { type: "i128" }),
  nativeToScVal(20, { type: "u32" }),
  nativeToScVal(7, { type: "u32" }),
];`;
}

export function getScriptHelp(kind = "args") {
  const base = `// StellarSdk is already imported
// proceed with:
const { nativeToScVal, Asset, Operation } = StellarSdk;

// Also available in runtime:
/// sdk, nativeToScVal, Address, Asset, Operation, xdr
/// address(), string(), symbol(), bool(), i128(), i64(), u32(), u64(), bytes(), scval()
/// context.userKey, context.network, context.contractId, context.selectedOperation`;

  if (kind === "payload") {
    return `${base}

// Return:
payload = { ... }`;
  }

  if (kind === "operations") {
    return `${base}

// Return:
operations = [ ... ]`;
  }

  return `${base}

// Return:
args = [ ... ]`;
}
