import * as StellarSdk from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
const { nativeToScVal } = StellarSdk;

function normalizeBigIntLike(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  return value;
}

export function createScriptApi(context = {}) {
  return {
    StellarSdk,
    sdk: StellarSdk,
    nativeToScVal: StellarSdk.nativeToScVal,
    Address: StellarSdk.Address,
    Asset: StellarSdk.Asset,
    Operation: StellarSdk.Operation,
    xdr: StellarSdk.xdr,
    context,
    bytes: (value) => {
      if (typeof value === "string") {
        // detect hex
        if (/^[0-9a-fA-F]+$/.test(value)) {
          return nativeToScVal(Buffer.from(value, "hex"), { type: "bytes" });
        }
      }
      return nativeToScVal(value, { type: "bytes" });
    },
    Buffer,

    address: (value) => nativeToScVal(value, { type: "address" }),
    string: (value) => nativeToScVal(value, { type: "string" }),
    symbol: (value) => nativeToScVal(value, { type: "symbol" }),
    bool: (value) => nativeToScVal(Boolean(value), { type: "bool" }),
    i128: (value) =>
      nativeToScVal(normalizeBigIntLike(value), { type: "i128" }),
    i64: (value) => nativeToScVal(normalizeBigIntLike(value), { type: "i64" }),
    u32: (value) => nativeToScVal(Number(value), { type: "u32" }),
    u64: (value) => nativeToScVal(normalizeBigIntLike(value), { type: "u64" }),
    scval: (value, type) =>
      type ? nativeToScVal(value, { type }) : nativeToScVal(value),
  };
}

function stripEditorOnlyImports(source) {
  return source
    .replace(
      /^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+["']@stellar\/stellar-sdk["'];?\s*$/gm,
      (_, ns) => `const ${ns} = sdk;`
    )
    .replace(
      /^\s*import\s+\{([^}]+)\}\s+from\s+["']@stellar\/stellar-sdk["'];?\s*$/gm,
      (_, imports) => {
        const names = imports
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((entry) => {
            // support alias: nativeToScVal as scvalFn
            const match = entry.match(
              /^([A-Za-z_$][\w$]*)(\s+as\s+([A-Za-z_$][\w$]*))?$/
            );
            if (!match) return entry;
            const original = match[1];
            const alias = match[3];
            return alias ? `${original}: ${alias}` : original;
          });

        if (!names.length) return "";
        return `const { ${names.join(", ")} } = sdk;`;
      }
    );
}

export function runUserScript(script, context = {}) {
  const api = createScriptApi(context);
  const executableScript = stripEditorOnlyImports(script);

  const executor = new Function(
    "api",
    `
      "use strict";
  
      const {
        sdk,
        StellarSdk,
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
  
      ${executableScript}
  
      if (typeof result !== "undefined") return result;
      if (typeof args !== "undefined") return { kind: "args", value: args };
      if (typeof payload !== "undefined") return { kind: "payload", value: payload };
      if (typeof operations !== "undefined") return { kind: "operations", value: operations };
  
      return undefined;
    `
  );

  return executor(api);
}

export function isScValLike(value) {
  return Boolean(
    value && typeof value === "object" && typeof value.switch === "function"
  );
}
