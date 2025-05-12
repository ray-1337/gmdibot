import { Client, Message, Uncached, AnyTextableGuildChannel, Member, PossiblyUncachedMessage } from "oceanic.js";
import {randomBytes} from "crypto";

export const defaultScrapUserAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

export const [officialAccountId, officialAccountKey] = (process.env.GD_ACCOUNT_KEY as string).split(" | ");

export const isDevMode = process.env.npm_lifecycle_event === "dev";

const regexDiscordID: RegExp = /(\d{17,19})/gim;

export function isDiscordIDValid(str: string) {
  return str.match(regexDiscordID) !== null;
};

export function extractDiscordID(str: string) {
  const matches = str.match(regexDiscordID);
  return matches !== null ? matches.shift() : null;
};

export function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
};

export async function transformMessage(client: Client, message: PossiblyUncachedMessage | null) {
  if (message) {
    if (message instanceof Message) {
      return message as Message<Uncached | AnyTextableGuildChannel>;
    } else {
      try {
        let restMessage = await client.rest.channels.getMessage<AnyTextableGuildChannel>(message.channel.id, message.id).catch(() => {});

        return restMessage || null;
      } catch (error) {
        console.error(error);
        return null;
      };
    }
  } else {
    return null;
  };
};

export function usernameHandle(user: Member | Member["user"]) {
  return user.discriminator === "0" ? `@${user.username}` : `${user.username}#${user.discriminator}`;
};

export function countString(string: string) {
  let freq = {};

  for (let i = 0; i < string.length; i++) {
    let char = string.charAt(i);
    freq[char] ? freq[char]++ : freq[char] = 1;
  };

  return Object.keys(freq).length >= 1 ? freq : null;
};

export function generateHash(length: number) {
  return randomBytes(length / 2).toString("hex");
};

export function truncate(str: string, len: number) {
  return (str.length >= len) ? str.substring(0, len - 1) + '...' : str;
};

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let randomIndex: number;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }

  return array;
};

export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min)) + Math.ceil(min));
};

export function customInaTime(unparsedTime: string) {
  return `${unparsedTime.replace(/\//gi, "-").replace("  ", "T").split(".").shift()}Z`;
};

export function randomInterval(intervalFunction, minDelay: number, maxDelay: number) {
  let timeout: ReturnType<typeof setTimeout>;

  const runInterval = (): void => {
    timeout = globalThis.setTimeout(() => {
      intervalFunction();
      runInterval();
    }, randomNumber(minDelay, maxDelay));
  };

  runInterval();

  return {
    clear(): void {
      clearTimeout(timeout);
    },
  };
};

// improved from https://earthquake.usgs.gov/education/shakingsimulations/colors.php
export function colorizedMagnitudeEmbed(magnitude: number) {
  // limit 4
  switch (true) {
    case magnitude >= 4 && magnitude <= 4.9: return 0xf69420;
    case magnitude >= 5 && magnitude <= 5.9: return 0xf66f2a;
    case magnitude >= 6 && magnitude <= 6.9: return 0xef452b;
    case magnitude >= 7 && magnitude <= 7.9: return 0xeb1c28;
    case magnitude >= 8 && magnitude <= 8.9: return 0xd6186e;
    case magnitude >= 9: return 0xa11253;
    default: return 0x121112;
  };
};

export function mercalliIntensityScale(magnitude: number) {
  // research
  // https://en.wikipedia.org/wiki/Modified_Mercalli_intensity_scale
  // https://www.bmkg.go.id/gempabumi/skala-mmi.bmkg

  // 1.0–3.0	I
  // 3.0–3.9	II–III
  // 4.0–4.9	IV–V
  // 5.0–5.9	VI–VII
  // 6.0–6.9	VII–VIII
  // 7.0 and higher	VIII or higher

  switch (true) {
    case magnitude <= 2.9: return "I";
    case magnitude >= 3.0 && magnitude <= 3.4: return "II";
    case magnitude >= 3.5 && magnitude <= 3.9: return "III";

    case magnitude >= 4.0 && magnitude <= 4.4: return "IV";
    case magnitude >= 4.5 && magnitude <= 4.9: return "V";

    case magnitude >= 5.0 && magnitude <= 5.4: return "VI";
    case magnitude >= 5.5 && magnitude <= 6.4: return "VII";
    case magnitude >= 6.5 && magnitude <= 6.9: return "VI";

    case magnitude >= 7.0: return "VIII";
  };
};

function prepareDefaultParameters() {
  const query = new URLSearchParams();

  query.append("password", officialAccountKey);
  query.append("accountID", officialAccountId);

  return query;
};

// get official GMDIBot account messages
export async function getOfficialMessagesFromGD() {
  const query = prepareDefaultParameters();

  const req = await fetch("https://gdbrowser.com/messages", {
    method: "POST",
    body: query.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": defaultScrapUserAgent
    }
  });

  if (!req.ok) {
    return null;
  };

  return await req.json() as Array<Record<"accountID" | "author" | "id" | "subject" | "date", string>>;
};

// get specific GMDIBot account message
export async function getMessageFromGD(id: string) {
  if (typeof id === "string" && isNaN(+id)) {
    return null;
  };

  const query = prepareDefaultParameters();

  const req = await fetch("https://gdbrowser.com/messages/" + id, {
    method: "POST",
    body: query.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": defaultScrapUserAgent
    }
  });

  if (!req.ok) {
    return null;
  };

  return await req.json() as NonNullable<Awaited<ReturnType<typeof getOfficialMessagesFromGD>>>[number] & { content: string };
};

// get user account data
export async function getGDUserData(username: string) {
  const req = await fetch("https://gdbrowser.com/api/profile/" + username, {
    method: "GET",
    headers: {
      "User-Agent": defaultScrapUserAgent
    }
  });

  if (!req.ok) {
    return null;
  };

  return await req.json() as Record<`${"star" | "diamond" | "coin" | "userCoin" | "demon"}s`, number> & { accountID: string };
};

// delete message
export async function deleteGDMessage(messageId: string): Promise<Boolean> {
  const query = prepareDefaultParameters();
  query.append("id[]", messageId);

  const req = await fetch("https://gdbrowser.com/deleteMessage/", {
    method: "POST",
    body: query.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": defaultScrapUserAgent
    }
  });

  if (!req.ok) {
    return false;
  };

  return true;
};

// check myGMDI blacklist
export async function checkPlayerAccountBlacklistRegistry() {
  const sheetId: string = "1OiSgtZ_P0fojAVyZErE9na5f6Z5eR-Hu6ICv4-6k85o";
  const ranges: string = "Pemain Terdaftar!A6:C";
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  const req = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${ranges}?key=${apiKey}&majorDimension=ROWS`);
  if (!req.ok) return null;

  const data = await req.json() as Record<"range" | "majorDimension", string> & { values: Array<[string, string, "TRUE" | "FALSE"]> };

  return data;
};