import crypto from "crypto";
import mime from "mime-db";

export function countString(string: string) {
  let freq = {};

  for (let i = 0; i < string.length; i++) {
    let char = string.charAt(i);
    freq[char] ? freq[char]++ : freq[char] = 1;
  };

  return Object.keys(freq).length >= 1 ? freq : null;
};

export function generateHash(length: number) {
  return crypto.randomBytes(length / 2).toString("hex");
};

export function truncate(str: string, len: number) {
  return (str.length >= len) ? str.substring(0, len - 1) + '...' : str;
};

export function contentTypeDecide(content_type: string) {
  let type = content_type.toLowerCase(), mimeExtension = mime[type].extensions;

  switch (content_type) {
    case "image/png": return "png";
    case "image/jpeg": return "jpeg";
    case "image/jpg": return "jpg";
    case "image/webp": return "webp";
    case "video/webm": return "webm";
    case "audio/mpeg": return "mp3";
    case "video/mpeg": case "video/mp4": return "mp4";
    case "video/quicktime": return "mov";
    default: mimeExtension !== undefined ? mimeExtension[0] : undefined;
  };
};

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};