/**
 * The trust rules exist twice: here and in the app (src/constants/trust.ts). If they drift,
 * the backend rejects requests the app thinks are valid. This test fails until both match.
 */
const fs = require("fs");
const path = require("path");
const trust = require("../constants/trust");

const appSource = fs.readFileSync(path.join(__dirname, "../../../src/constants/trust.ts"), "utf8");

const stringConst = (name) => appSource.match(new RegExp(`${name} = "([^"]+)"`))?.[1];
const arrayConst = (name) => {
  const body = appSource.match(new RegExp(`${name} = \\[([^\\]]*)\\]`))?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};
const adviceMap = () => {
  const body = appSource.match(/ADVICE_CATEGORIES[^{]*\{([^}]*)\}/)?.[1] ?? "";
  return Object.fromEntries(
    [...body.matchAll(/"?([A-Za-z &]+?)"?:\s*"advice_([a-z_]+)"/g)].map((m) => [m[1].trim(), m[2]])
  );
};

describe("trust constants stay in sync with the app", () => {
  test("versions match", () => {
    expect(stringConst("TERMS_VERSION")).toBe(trust.TERMS_VERSION);
    expect(stringConst("DISCLAIMER_VERSION")).toBe(trust.DISCLAIMER_VERSION);
  });

  test("regulated trades and trade categories match", () => {
    expect(arrayConst("REGULATED_CATEGORIES")).toEqual(trust.REGULATED_CATEGORIES);
    expect(arrayConst("REGULATED_SKILLS")).toEqual(trust.REGULATED_SKILLS);
    expect(arrayConst("TRADE_CATEGORIES")).toEqual(trust.TRADE_CATEGORIES);
  });

  test("advice categories map to the same disclaimers", () => {
    expect(adviceMap()).toEqual(trust.ADVICE_CATEGORIES);
  });
});
