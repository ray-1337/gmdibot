import crypto from "crypto";
import fs from "fs";
import https from "https";

export default class Util {
  generateHash: (length: number) => string;
  truncate: (string: string, length: number) => string;
  contentTypeDecide: (content_type: string) => string | null;
  getRandomInt: (min: number, max: number) => number;
  countString: (string: string) => {} | null;

  constructor() {
    this.countString = function countString(string: string) {
      let freq = {};

      for (var i = 0; i < string.length; i++) {
        var char = string.charAt(i);
        if (freq[char]) freq[char]++;
        else freq[char] = 1;
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
      let type = content_type?.toLowerCase(), ext;

      switch (type) {
        case "image/jpeg":
          ext = "jpeg";
          break;
        
        case "image/jpg":
          ext = "jpg";
          break;
        
        case "image/webp":
          ext = "webp";
          break;

        case "image/vnd.mozilla.apng":
        case "image/png":
          ext = "png";
          break;
        
        case "video/mp4":
          ext = "mp4";
          break;

        case "video/quicktime":
          ext = "mov";
          break;

        case "video/webm":
          ext = "webm";
          break;

        case "image/gif":
          ext = "gif";
          break;

        default: break;
      };

      return ext || null;
    };

    this.getRandomInt = function getRandomInt(min: number, max: number) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
  };
};