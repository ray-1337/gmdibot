import crypto from "crypto";
import mime from "mime-db";

export default class Util {
  generateHash: (length: number) => string;
  truncate: (string: string, length: number) => string;
  contentTypeDecide: (content_type: string) => string | null;
  getRandomInt: (min: number, max: number) => number;
  countString: (string: string) => {} | null;

  constructor() {
    this.countString = function countString(string: string) {
      let freq = {};

      for (let i = 0; i < string.length; i++) {
        let char = string.charAt(i);
        freq[char] ? freq[char]++ : freq[char] = 1;
      };

      return Object.keys(freq).length >= 1 ? freq : null;
    };

    this.generateHash = function generateHash(length: number) {
      return crypto.randomBytes(length / 2).toString("hex");
    };

    this.truncate = function truncate(str: string, len: number) {
      return (str.length >= len) ? str.substring(0, len - 1) + '...' : str;
    };

    this.contentTypeDecide = function contentTypeDecide(content_type: string) {
      let type = content_type?.toLowerCase(), mimeExtension = mime[type].extensions;

      return mimeExtension ? mimeExtension[0] : null;
    };

    this.getRandomInt = function getRandomInt(min: number, max: number) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
  };
};