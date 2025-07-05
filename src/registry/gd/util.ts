import { createHash } from "node:crypto";

// https://github.com/101arrowz/gd.js/blob/357c33c1069aaa015067a25d05c446b05be309f0/src/util/parse.ts#L26
export function parseRobTopData(str: string) {
  const parsedStr = str.split(":");

  const obj: Record<number, string> = {};
  for (let i = 0; i < parsedStr.length; i += 2) {
    obj[parsedStr[i]] = parsedStr[i + 1];
  };

  return obj;
};

export function hashRobTopCredential(key: string, salt = "mI29fmAnxgTs") {
  return createHash('sha1').update(key + salt).digest('hex');
};

export function wrapPropertiesToSearchParams(obj: Record<string, string | number>) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => params.append(k, typeof v !== "string" ? String(v) : v));

  return params;
};

export function isError(str: string) {
  return ["-2", "-1"].includes(str);
};

function exposeXOR(str: string, key = "14251") {
  return String.fromCodePoint(...str.split('').map((char, i) => char.charCodeAt(0) ^ key.toString().charCodeAt(i % key.toString().length)));
};

export function decodeMessage(str: string) {
  return exposeXOR(Buffer.from(str, "base64url").toString("utf-8"));
};