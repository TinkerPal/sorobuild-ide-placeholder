import {
  nativeToScVal,
  Address,
  Asset,
  Operation,
  xdr,
} from "@stellar/stellar-sdk";

function normalizeBigIntLike(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  return value;
}

export function createScriptApi(context = {}) {
  return {
    nativeToScVal,
    Address,
    Asset,
    Operation,
    xdr,

    context,

    address: (value) => nativeToScVal(value, { type: "address" }),
    string: (value) => nativeToScVal(value, { type: "string" }),
    symbol: (value) => nativeToScVal(value, { type: "symbol" }),
    bool: (value) => nativeToScVal(Boolean(value), { type: "bool" }),
    i128: (value) =>
      nativeToScVal(normalizeBigIntLike(value), { type: "i128" }),
    i64: (value) => nativeToScVal(normalizeBigIntLike(value), { type: "i64" }),
    u32: (value) => nativeToScVal(Number(value), { type: "u32" }),
    u64: (value) => nativeToScVal(normalizeBigIntLike(value), { type: "u64" }),
    bytes: (value) => nativeToScVal(value, { type: "bytes" }),

    scval: (value, type) => nativeToScVal(value, { type }),
  };
}

export function runUserScript(script, context = {}) {
  const api = createScriptApi(context);

  const executor = new Function(
    "api",
    `
      "use strict";

      const {
        nativeToScVal,
        Address,
        Asset,
        Operation,
        xdr,
        context,
        address,
        string,
        symbol,
        bool,
        i128,
        i64,
        u32,
        u64,
        bytes,
        scval,
      } = api;

      let args;
      let payload;
      let operations;
      let result;

      ${script}

      if (typeof result !== "undefined") return result;
      if (typeof args !== "undefined") return { kind: "args", value: args };
      if (typeof payload !== "undefined") return { kind: "payload", value: payload };
      if (typeof operations !== "undefined") return { kind: "operations", value: operations };

      return undefined;
    `
  );

  return executor(api);
}
