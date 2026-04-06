import {
  Soroban,
  ScInt,
  nativeToScVal,
  Address,
  Operation,
  Asset,
  Claimant,
} from "@stellar/stellar-sdk";

const accountToScVal = (account) => new Address(account).toScVal();

function stringToArray(input) {
  if (!!input) {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
  }
  return [];
}

export function processArgs(arg) {
  if (arg.type === "i128") {
    const decimal = arg?.decimal ? Number(arg?.decimal) : 7;
    const quantity = Soroban.parseTokenAmount(arg.value, decimal);
    return new ScInt(quantity).toI128();
  } else if (arg.type === "Address") {
    return accountToScVal(arg.value); // to
  } else if (arg.type === "u32") {
    return nativeToScVal(Number(arg.value), { type: "u32" }); // to
  } else if (arg.type === "u64") {
    return nativeToScVal(Number(arg.value)); // to
  } else if (arg.type === "u64") {
    return nativeToScVal(Number(arg.value)); // to
  } else if (arg.type === "symbol") {
    return nativeToScVal(arg.value, { type: "symbol" }); // to
  } else if (arg.type === "None" || arg.type === "option") {
    return nativeToScVal(null); // to
  } else if (arg.type === "Wasm") {
    return;
  } else if (arg.type === "BytesNString") {
    return nativeToScVal(Buffer.from(arg.value, "hex"), { type: "bytes" });
  } else if (arg.type === "vec") {
    const arrs = stringToArray(arg.value);
    const argsare = nativeToScVal(arrs, {
      type: ["u64", "u64", "symbol"],
    }); // to

    return argsare;
  } else {
    return nativeToScVal(arg.value);
  }
}

function assetFrom(code, issuer) {
  if (!code) {
    throw new Error("Asset code is required");
  }

  if (code === "XLM") {
    return Asset.native();
  }

  if (!issuer) {
    throw new Error(`Issuer is required for non-native asset: ${code}`);
  }

  return new Asset(code, issuer);
}

function parseJsonField(value, fallback) {
  if (value == null || value === "") return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  return JSON.parse(value);
}

function parsePrice(value) {
  if (value == null || value === "") return undefined;
  if (typeof value === "object") return value;

  const trimmed = String(value).trim();

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  return trimmed;
}

function parseBool(value) {
  if (value === true || value === false) return value;
  if (value == null || value === "") return undefined;

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
}

function buildPath(pathValue) {
  const raw = parseJsonField(pathValue, []);
  return raw.map((item) =>
    assetFrom(item.assetCode ?? item.code, item.issuerAddress ?? item.issuer)
  );
}

function buildClaimants(claimantsValue) {
  const raw = parseJsonField(claimantsValue, []);

  return raw.map((item) => {
    if (!item.destination) {
      throw new Error("Each claimant must include a destination");
    }

    if (item.predicate) {
      return new Claimant(item.destination, item.predicate);
    }

    return new Claimant(item.destination, Claimant.predicateUnconditional());
  });
}

export function buildOperation(op) {
  const v = op.values || {};

  switch (op.type) {
    case "createAccount":
      return Operation.createAccount({
        destination: v.destination,
        startingBalance: v.startingBalance,
      });

    case "payment":
      return Operation.payment({
        destination: v.destination,
        asset: assetFrom(v.assetCode, v.issuerAddress),
        amount: v.amount,
      });

    case "pathPaymentStrictReceive":
      return Operation.pathPaymentStrictReceive({
        sendAsset: assetFrom(v.sendAssetCode, v.sendIssuerAddress),
        sendMax: v.sendMax,
        destination: v.destination,
        destAsset: assetFrom(v.destAssetCode, v.destIssuerAddress),
        destAmount: v.destAmount,
        path: buildPath(v.path),
      });

    case "pathPaymentStrictSend":
      return Operation.pathPaymentStrictSend({
        sendAsset: assetFrom(v.sendAssetCode, v.sendIssuerAddress),
        sendAmount: v.sendAmount,
        destination: v.destination,
        destAsset: assetFrom(v.destAssetCode, v.destIssuerAddress),
        destMin: v.destMin,
        path: buildPath(v.path),
      });

    case "manageSellOffer":
      return Operation.manageSellOffer({
        selling: assetFrom(v.sellingAssetCode, v.sellingIssuerAddress),
        buying: assetFrom(v.buyingAssetCode, v.buyingIssuerAddress),
        amount: v.amount,
        price: parsePrice(v.price),
        offerId: v.offerId || "0",
      });

    case "manageBuyOffer":
      return Operation.manageBuyOffer({
        selling: assetFrom(v.sellingAssetCode, v.sellingIssuerAddress),
        buying: assetFrom(v.buyingAssetCode, v.buyingIssuerAddress),
        buyAmount: v.buyAmount,
        price: parsePrice(v.price),
        offerId: v.offerId || "0",
      });

    case "createPassiveSellOffer":
      return Operation.createPassiveSellOffer({
        selling: assetFrom(v.sellingAssetCode, v.sellingIssuerAddress),
        buying: assetFrom(v.buyingAssetCode, v.buyingIssuerAddress),
        amount: v.amount,
        price: parsePrice(v.price),
      });

    case "setOptions":
      return Operation.setOptions({
        inflationDest: v.inflationDest || undefined,
        clearFlags:
          v.clearFlags !== undefined && v.clearFlags !== ""
            ? Number(v.clearFlags)
            : undefined,
        setFlags:
          v.setFlags !== undefined && v.setFlags !== ""
            ? Number(v.setFlags)
            : undefined,
        masterWeight:
          v.masterWeight !== undefined && v.masterWeight !== ""
            ? Number(v.masterWeight)
            : undefined,
        lowThreshold:
          v.lowThreshold !== undefined && v.lowThreshold !== ""
            ? Number(v.lowThreshold)
            : undefined,
        medThreshold:
          v.medThreshold !== undefined && v.medThreshold !== ""
            ? Number(v.medThreshold)
            : undefined,
        highThreshold:
          v.highThreshold !== undefined && v.highThreshold !== ""
            ? Number(v.highThreshold)
            : undefined,
        homeDomain: v.homeDomain || undefined,
        signer: v.signer
          ? {
              ed25519PublicKey: v.signer,
              weight:
                v.weight !== undefined && v.weight !== ""
                  ? Number(v.weight)
                  : 1,
            }
          : undefined,
      });

    case "changeTrust":
      return Operation.changeTrust({
        asset: assetFrom(v.assetCode, v.issuerAddress),
        limit: v.limit || undefined,
      });

    case "allowTrust":
      return Operation.allowTrust({
        trustor: v.trustor,
        assetCode: v.assetCode,
        authorize:
          v.authorize !== undefined && v.authorize !== ""
            ? Number(v.authorize)
            : 1,
      });

    case "accountMerge":
      return Operation.accountMerge({
        destination: v.destination,
      });

    case "manageData":
      return Operation.manageData({
        name: v.name,
        value: v.value || null,
      });

    case "bumpSequence":
      return Operation.bumpSequence({
        bumpTo: v.bumpTo,
      });

    case "createClaimableBalance":
      return Operation.createClaimableBalance({
        asset: assetFrom(v.assetCode, v.issuerAddress),
        amount: v.amount,
        claimants: buildClaimants(v.claimants),
      });

    case "claimClaimableBalance":
      return Operation.claimClaimableBalance({
        balanceId: v.balanceId,
      });

    case "beginSponsoringFutureReserves":
      return Operation.beginSponsoringFutureReserves({
        sponsoredId: v.sponsoredId,
      });

    case "endSponsoringFutureReserves":
      return Operation.endSponsoringFutureReserves();

    case "revokeAccountSponsorship":
      return Operation.revokeAccountSponsorship({
        account: v.account,
      });

    case "revokeTrustlineSponsorship":
      return Operation.revokeTrustlineSponsorship({
        account: v.account,
        asset: assetFrom(v.assetCode, v.issuerAddress),
      });

    case "revokeOfferSponsorship":
      return Operation.revokeOfferSponsorship({
        seller: v.seller,
        offerId: v.offerId,
      });

    case "revokeDataSponsorship":
      return Operation.revokeDataSponsorship({
        account: v.account,
        name: v.name,
      });

    case "revokeClaimableBalanceSponsorship":
      return Operation.revokeClaimableBalanceSponsorship({
        balanceId: v.balanceId,
      });

    case "revokeLiquidityPoolSponsorship":
      return Operation.revokeLiquidityPoolSponsorship({
        liquidityPoolId: v.liquidityPoolId,
      });

    case "revokeSignerSponsorship":
      return Operation.revokeSignerSponsorship({
        account: v.account,
        signer: {
          ed25519PublicKey: v.signer,
        },
      });

    case "clawback":
      return Operation.clawback({
        asset: assetFrom(v.assetCode, v.issuerAddress),
        from: v.from,
        amount: v.amount,
      });

    case "clawbackClaimableBalance":
      return Operation.clawbackClaimableBalance({
        balanceId: v.balanceId,
      });

    case "setTrustLineFlags":
      return Operation.setTrustLineFlags({
        trustor: v.trustor,
        asset: assetFrom(v.assetCode, v.issuerAddress),
        flags: {
          authorized: parseBool(v.authorized),
          authorizedToMaintainLiabilities: parseBool(
            v.authorizedToMaintainLiabilities
          ),
          clawbackEnabled: parseBool(v.clawbackEnabled),
        },
      });

    case "liquidityPoolDeposit":
      return Operation.liquidityPoolDeposit({
        liquidityPoolId: v.liquidityPoolId,
        maxAmountA: v.maxAmountA,
        maxAmountB: v.maxAmountB,
        minPrice: parsePrice(v.minPrice),
        maxPrice: parsePrice(v.maxPrice),
      });

    case "liquidityPoolWithdraw":
      return Operation.liquidityPoolWithdraw({
        liquidityPoolId: v.liquidityPoolId,
        amount: v.amount,
        minAmountA: v.minAmountA,
        minAmountB: v.minAmountB,
      });

    default:
      throw new Error(`Unsupported operation type: ${op.type}`);
  }
}

const assetFields = (prefix = "") => [
  {
    name: `${prefix}assetCode`,
    label: "Asset code",
    placeholder: "ex: USDC or XLM",
    required: true,
  },
  {
    name: `${prefix}issuerAddress`,
    label: "Issuer address",
    placeholder: "G... (leave empty for XLM)",
    required: false,
  },
];

const sellingAssetFields = [
  {
    name: "sellingAssetCode",
    label: "Selling asset code",
    placeholder: "ex: XLM",
    required: true,
  },
  {
    name: "sellingIssuerAddress",
    label: "Selling issuer address",
    placeholder: "G... (leave empty for XLM)",
    required: false,
  },
];

const buyingAssetFields = [
  {
    name: "buyingAssetCode",
    label: "Buying asset code",
    placeholder: "ex: USDC",
    required: true,
  },
  {
    name: "buyingIssuerAddress",
    label: "Buying issuer address",
    placeholder: "G... (leave empty for XLM)",
    required: false,
  },
];

export const builderOperationOptions = [
  {
    id: "createAccount",
    label: "Create Account",
    description: "Create and fund a new Stellar account",
    fields: [
      {
        name: "destination",
        label: "Destination address",
        placeholder: "G...",
        required: true,
      },
      {
        name: "startingBalance",
        label: "Starting balance (XLM)",
        placeholder: "ex: 2",
        required: true,
      },
    ],
  },

  {
    id: "payment",
    label: "Payment",
    description: "Send a payment in XLM or a Stellar asset",
    fields: [
      ...assetFields(),
      {
        name: "amount",
        label: "Amount",
        placeholder: "ex: 50",
        required: true,
      },
      {
        name: "destination",
        label: "Destination address",
        placeholder: "G...",
        required: true,
      },
    ],
  },

  {
    id: "pathPaymentStrictReceive",
    label: "Path Payment Strict Receive",
    description: "Deliver an exact destination amount through an optional path",
    fields: [
      {
        name: "sendAssetCode",
        label: "Send asset code",
        placeholder: "ex: XLM",
        required: true,
      },
      {
        name: "sendIssuerAddress",
        label: "Send issuer address",
        placeholder: "G... (leave empty for XLM)",
        required: false,
      },
      {
        name: "sendMax",
        label: "Max send amount",
        placeholder: "ex: 100",
        required: true,
      },
      {
        name: "destination",
        label: "Destination address",
        placeholder: "G...",
        required: true,
      },
      {
        name: "destAssetCode",
        label: "Destination asset code",
        placeholder: "ex: USDC",
        required: true,
      },
      {
        name: "destIssuerAddress",
        label: "Destination issuer address",
        placeholder: "G... (leave empty for XLM)",
        required: false,
      },
      {
        name: "destAmount",
        label: "Destination amount",
        placeholder: "ex: 25",
        required: true,
      },
      {
        name: "path",
        label: "Path assets (JSON array)",
        placeholder:
          '[{"assetCode":"XLM"},{"assetCode":"USDC","issuerAddress":"G..."}]',
        required: false,
        kind: "textarea",
      },
    ],
  },

  {
    id: "pathPaymentStrictSend",
    label: "Path Payment Strict Send",
    description: "Send an exact amount through an optional path",
    fields: [
      {
        name: "sendAssetCode",
        label: "Send asset code",
        placeholder: "ex: XLM",
        required: true,
      },
      {
        name: "sendIssuerAddress",
        label: "Send issuer address",
        placeholder: "G... (leave empty for XLM)",
        required: false,
      },
      {
        name: "sendAmount",
        label: "Send amount",
        placeholder: "ex: 100",
        required: true,
      },
      {
        name: "destination",
        label: "Destination address",
        placeholder: "G...",
        required: true,
      },
      {
        name: "destAssetCode",
        label: "Destination asset code",
        placeholder: "ex: USDC",
        required: true,
      },
      {
        name: "destIssuerAddress",
        label: "Destination issuer address",
        placeholder: "G... (leave empty for XLM)",
        required: false,
      },
      {
        name: "destMin",
        label: "Minimum destination amount",
        placeholder: "ex: 25",
        required: true,
      },
      {
        name: "path",
        label: "Path assets (JSON array)",
        placeholder:
          '[{"assetCode":"XLM"},{"assetCode":"USDC","issuerAddress":"G..."}]',
        required: false,
        kind: "textarea",
      },
    ],
  },

  {
    id: "manageSellOffer",
    label: "Manage Sell Offer",
    description: "Create, update, or delete a sell offer",
    fields: [
      ...sellingAssetFields,
      ...buyingAssetFields,
      {
        name: "amount",
        label: "Sell amount",
        placeholder: "ex: 100",
        required: true,
      },
      {
        name: "price",
        label: "Price",
        placeholder: 'ex: "0.5" or {"n":1,"d":2}',
        required: true,
      },
      {
        name: "offerId",
        label: "Offer ID",
        placeholder: "0 for new offer",
        required: false,
      },
    ],
  },

  {
    id: "manageBuyOffer",
    label: "Manage Buy Offer",
    description: "Create, update, or delete a buy offer",
    fields: [
      ...sellingAssetFields,
      ...buyingAssetFields,
      {
        name: "buyAmount",
        label: "Buy amount",
        placeholder: "ex: 100",
        required: true,
      },
      {
        name: "price",
        label: "Price",
        placeholder: 'ex: "2" or {"n":2,"d":1}',
        required: true,
      },
      {
        name: "offerId",
        label: "Offer ID",
        placeholder: "0 for new offer",
        required: false,
      },
    ],
  },

  {
    id: "createPassiveSellOffer",
    label: "Create Passive Sell Offer",
    description: "Create a passive sell offer",
    fields: [
      ...sellingAssetFields,
      ...buyingAssetFields,
      {
        name: "amount",
        label: "Sell amount",
        placeholder: "ex: 100",
        required: true,
      },
      {
        name: "price",
        label: "Price",
        placeholder: 'ex: "1.25" or {"n":5,"d":4}',
        required: true,
      },
    ],
  },

  {
    id: "setOptions",
    label: "Set Options",
    description:
      "Update account options, flags, thresholds, signer, or home domain",
    fields: [
      {
        name: "inflationDest",
        label: "Inflation destination",
        placeholder: "G...",
        required: false,
      },
      {
        name: "clearFlags",
        label: "Clear flags (number)",
        placeholder: "ex: 1",
        required: false,
      },
      {
        name: "setFlags",
        label: "Set flags (number)",
        placeholder: "ex: 2",
        required: false,
      },
      {
        name: "masterWeight",
        label: "Master weight",
        placeholder: "0 - 255",
        required: false,
      },
      {
        name: "lowThreshold",
        label: "Low threshold",
        placeholder: "0 - 255",
        required: false,
      },
      {
        name: "medThreshold",
        label: "Medium threshold",
        placeholder: "0 - 255",
        required: false,
      },
      {
        name: "highThreshold",
        label: "High threshold",
        placeholder: "0 - 255",
        required: false,
      },
      {
        name: "homeDomain",
        label: "Home domain",
        placeholder: "ex: example.com",
        required: false,
      },
      {
        name: "signer",
        label: "Signer public key",
        placeholder: "G...",
        required: false,
      },
      {
        name: "weight",
        label: "Signer weight",
        placeholder: "1 - 255",
        required: false,
      },
    ],
  },

  {
    id: "changeTrust",
    label: "Change Trustline",
    description: "Create, update, or remove a trustline",
    fields: [
      ...assetFields(),
      {
        name: "limit",
        label: "Limit",
        placeholder: "ex: 1000 (0 to delete trustline)",
        required: false,
      },
    ],
  },

  {
    id: "allowTrust",
    label: "Allow Trust",
    description: "Authorize or deauthorize another account to hold your asset",
    fields: [
      {
        name: "trustor",
        label: "Trustor address",
        placeholder: "G...",
        required: true,
      },
      {
        name: "assetCode",
        label: "Asset code",
        placeholder: "ex: USDC",
        required: true,
      },
      {
        name: "authorize",
        label: "Authorize",
        placeholder: "0, 1, or 2",
        required: true,
      },
    ],
  },

  {
    id: "accountMerge",
    label: "Account Merge",
    description: "Merge the source account into a destination account",
    fields: [
      {
        name: "destination",
        label: "Destination address",
        placeholder: "G...",
        required: true,
      },
    ],
  },

  {
    id: "manageData",
    label: "Manage Data",
    description: "Create, update, or remove a data entry",
    fields: [
      {
        name: "name",
        label: "Data key",
        placeholder: "ex: profile",
        required: true,
      },
      {
        name: "value",
        label: "Data value",
        placeholder: "Leave empty or null to delete",
        required: false,
      },
    ],
  },

  {
    id: "bumpSequence",
    label: "Bump Sequence",
    description: "Raise an account sequence number",
    fields: [
      {
        name: "bumpTo",
        label: "Sequence to bump to",
        placeholder: "ex: 123456789",
        required: true,
      },
    ],
  },

  {
    id: "createClaimableBalance",
    label: "Create Claimable Balance",
    description: "Create a claimable balance with claimants",
    fields: [
      ...assetFields(),
      {
        name: "amount",
        label: "Amount",
        placeholder: "ex: 25",
        required: true,
      },
      {
        name: "claimants",
        label: "Claimants (JSON array)",
        placeholder:
          '[{"destination":"G...","predicate":{"unconditional":true}}]',
        required: true,
        kind: "textarea",
      },
    ],
  },

  {
    id: "claimClaimableBalance",
    label: "Claim Claimable Balance",
    description: "Claim an existing claimable balance",
    fields: [
      {
        name: "balanceId",
        label: "Balance ID",
        placeholder: "hex balance id",
        required: true,
      },
    ],
  },

  {
    id: "beginSponsoringFutureReserves",
    label: "Begin Sponsoring Future Reserves",
    description: "Begin sponsoring reserves for another account",
    fields: [
      {
        name: "sponsoredId",
        label: "Sponsored account ID",
        placeholder: "G...",
        required: true,
      },
    ],
  },

  {
    id: "endSponsoringFutureReserves",
    label: "End Sponsoring Future Reserves",
    description: "End the current reserve sponsorship",
    fields: [],
  },

  {
    id: "revokeAccountSponsorship",
    label: "Revoke Account Sponsorship",
    description: "Revoke sponsorship for an account",
    fields: [
      {
        name: "account",
        label: "Account",
        placeholder: "G...",
        required: true,
      },
    ],
  },

  {
    id: "revokeTrustlineSponsorship",
    label: "Revoke Trustline Sponsorship",
    description: "Revoke sponsorship for a trustline",
    fields: [
      {
        name: "account",
        label: "Account",
        placeholder: "G...",
        required: true,
      },
      ...assetFields(),
    ],
  },

  {
    id: "revokeOfferSponsorship",
    label: "Revoke Offer Sponsorship",
    description: "Revoke sponsorship for an offer",
    fields: [
      {
        name: "seller",
        label: "Seller address",
        placeholder: "G...",
        required: true,
      },
      {
        name: "offerId",
        label: "Offer ID",
        placeholder: "ex: 12345",
        required: true,
      },
    ],
  },

  {
    id: "revokeDataSponsorship",
    label: "Revoke Data Sponsorship",
    description: "Revoke sponsorship for a data entry",
    fields: [
      {
        name: "account",
        label: "Account",
        placeholder: "G...",
        required: true,
      },
      {
        name: "name",
        label: "Data key",
        placeholder: "ex: profile",
        required: true,
      },
    ],
  },

  {
    id: "revokeClaimableBalanceSponsorship",
    label: "Revoke Claimable Balance Sponsorship",
    description: "Revoke sponsorship for a claimable balance",
    fields: [
      {
        name: "balanceId",
        label: "Balance ID",
        placeholder: "hex balance id",
        required: true,
      },
    ],
  },

  {
    id: "revokeLiquidityPoolSponsorship",
    label: "Revoke Liquidity Pool Sponsorship",
    description: "Revoke sponsorship for a liquidity pool share trustline",
    fields: [
      {
        name: "liquidityPoolId",
        label: "Liquidity pool ID",
        placeholder: "hex liquidity pool id",
        required: true,
      },
    ],
  },

  {
    id: "revokeSignerSponsorship",
    label: "Revoke Signer Sponsorship",
    description: "Revoke sponsorship for a signer",
    fields: [
      {
        name: "account",
        label: "Account",
        placeholder: "G...",
        required: true,
      },
      {
        name: "signer",
        label: "Signer key",
        placeholder: "G... / T... / hashX",
        required: true,
      },
    ],
  },

  {
    id: "clawback",
    label: "Clawback",
    description: "Claw back an asset from a trustline holder",
    fields: [
      ...assetFields(),
      {
        name: "amount",
        label: "Amount",
        placeholder: "ex: 10",
        required: true,
      },
      {
        name: "from",
        label: "From account",
        placeholder: "G... or M...",
        required: true,
      },
    ],
  },

  {
    id: "clawbackClaimableBalance",
    label: "Clawback Claimable Balance",
    description: "Claw back a claimable balance",
    fields: [
      {
        name: "balanceId",
        label: "Balance ID",
        placeholder: "hex balance id",
        required: true,
      },
    ],
  },

  {
    id: "setTrustLineFlags",
    label: "Set Trustline Flags",
    description: "Modify trustline flags",
    fields: [
      {
        name: "trustor",
        label: "Trustor address",
        placeholder: "G...",
        required: true,
      },
      ...assetFields(),
      {
        name: "authorized",
        label: "Authorized",
        placeholder: "true / false",
        required: false,
        kind: "boolean",
      },
      {
        name: "authorizedToMaintainLiabilities",
        label: "Authorized to maintain liabilities",
        placeholder: "true / false",
        required: false,
        kind: "boolean",
      },
      {
        name: "clawbackEnabled",
        label: "Clawback enabled",
        placeholder: "false only",
        required: false,
        kind: "boolean",
      },
    ],
  },

  {
    id: "liquidityPoolDeposit",
    label: "Liquidity Pool Deposit",
    description: "Deposit into a liquidity pool",
    fields: [
      {
        name: "liquidityPoolId",
        label: "Liquidity pool ID",
        placeholder: "hex liquidity pool id",
        required: true,
      },
      {
        name: "maxAmountA",
        label: "Max amount A",
        placeholder: "ex: 100",
        required: true,
      },
      {
        name: "maxAmountB",
        label: "Max amount B",
        placeholder: "ex: 50",
        required: true,
      },
      {
        name: "minPrice",
        label: "Min price",
        placeholder: 'ex: "0.5" or {"n":1,"d":2}',
        required: true,
      },
      {
        name: "maxPrice",
        label: "Max price",
        placeholder: 'ex: "2" or {"n":2,"d":1}',
        required: true,
      },
    ],
  },

  {
    id: "liquidityPoolWithdraw",
    label: "Liquidity Pool Withdraw",
    description: "Withdraw from a liquidity pool",
    fields: [
      {
        name: "liquidityPoolId",
        label: "Liquidity pool ID",
        placeholder: "hex liquidity pool id",
        required: true,
      },
      {
        name: "amount",
        label: "Pool share amount",
        placeholder: "ex: 10",
        required: true,
      },
      {
        name: "minAmountA",
        label: "Min amount A",
        placeholder: "ex: 5",
        required: true,
      },
      {
        name: "minAmountB",
        label: "Min amount B",
        placeholder: "ex: 5",
        required: true,
      },
    ],
  },
];
function formatOperationType(type) {
  if (!type) return "Operation";

  const map = {
    createAccount: "Create Account",
    payment: "Payment",
    pathPaymentStrictReceive: "Path Payment Strict Receive",
    pathPaymentStrictSend: "Path Payment Strict Send",
    manageSellOffer: "Manage Sell Offer",
    manageBuyOffer: "Manage Buy Offer",
    createPassiveSellOffer: "Passive Sell Offer",
    setOptions: "Set Options",
    changeTrust: "Change Trustline",
    allowTrust: "Allow Trust",
    accountMerge: "Account Merge",
    manageData: "Manage Data",
    bumpSequence: "Bump Sequence",
    createClaimableBalance: "Create Claimable Balance",
    claimClaimableBalance: "Claim Claimable Balance",
    beginSponsoringFutureReserves: "Begin Sponsoring",
    endSponsoringFutureReserves: "End Sponsoring",
    revokeAccountSponsorship: "Revoke Account Sponsorship",
    revokeTrustlineSponsorship: "Revoke Trustline Sponsorship",
    revokeOfferSponsorship: "Revoke Offer Sponsorship",
    revokeDataSponsorship: "Revoke Data Sponsorship",
    revokeClaimableBalanceSponsorship: "Revoke Claimable Balance",
    revokeLiquidityPoolSponsorship: "Revoke Pool Sponsorship",
    revokeSignerSponsorship: "Revoke Signer Sponsorship",
    clawback: "Clawback",
    clawbackClaimableBalance: "Clawback Claimable Balance",
    setTrustLineFlags: "Set Trustline Flags",
    liquidityPoolDeposit: "Liquidity Pool Deposit",
    liquidityPoolWithdraw: "Liquidity Pool Withdraw",
    scriptOperation: "Script Operation",
  };

  return map[type] || type;
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "[Object]";
  }
}

export const flattenObject = (obj) => {
  const result = { ...obj }; // Shallow copy to avoid modifying the original object

  // Check if 'values' exists and handle it accordingly
  if (result.values) {
    // If 'values' is a string, try to parse it as JSON
    if (typeof result.values === "string") {
      try {
        const parsedValues = JSON.parse(result.values);
        Object.assign(result, parsedValues); // Merge parsed values into the main object
      } catch (error) {
        console.error("Error parsing values as JSON:", error, result.values);
      }
    } else if (typeof result.values === "object" && result.values !== null) {
      // If 'values' is already an object, directly merge it into the result
      Object.assign(result, result.values);
    } else {
      console.error("Unexpected 'values' type:", typeof result.values);
    }

    delete result.values; // Remove the 'values' key as it's no longer needed
  }

  return result;
};

function normalizeFlat(input = {}) {
  const out = {};

  for (const [key, value] of Object.entries(input)) {
    // ✅ primitives → keep as is
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
      continue;
    }

    // ✅ Asset-like object → convert to string
    if (value?.code && value?.issuer) {
      out[key] = `${value.code}:${value.issuer}`;
      continue;
    }

    // ✅ arrays → flatten values
    if (Array.isArray(value)) {
      out[key] = value.map((v) => {
        if (v?.code && v?.issuer) {
          return `${v.code}:${v.issuer}`;
        }
        return String(v);
      });
      continue;
    }

    // ✅ other objects → stringify safely (no nesting)
    if (value && typeof value === "object") {
      out[key] = safeStringify(value);
      continue;
    }

    // fallback
    out[key] = value;
  }

  return out;
}

function createWrappedOperation(Operation, capturedOperations) {
  const WrappedOperation = {};

  Object.keys(Operation).forEach((key) => {
    if (typeof Operation[key] !== "function") return;

    WrappedOperation[key] = (input = {}) => {
      const built = Operation[key](input);

      capturedOperations.push({
        id: `${key}-${Date.now()}-${capturedOperations.length}`,
        type: key,
        label: formatOperationType(key),
        ...normalizeFlat(input), // 👈 fully generic
      });

      return built;
    };
  });

  return WrappedOperation;
}

export function runBuilderScript(script) {
  const capturedOperations = [];

  const WrappedOperation = createWrappedOperation(
    Operation,
    capturedOperations
  );

  const fn = new Function(
    "Operation",
    "Asset",
    `
      let operations = [];
      ${script}
      return { operations };
    `
  );

  fn(WrappedOperation, Asset);

  return capturedOperations;
}
