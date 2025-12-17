import { Client, Message, Uncached, AnyTextableGuildChannel, Member, PossiblyUncachedMessage } from "oceanic.js";
import { randomInt } from "crypto";

export const isDevMode = process.env.npm_lifecycle_event === "dev";

const regexDiscordID: RegExp = /(\d{16,19})/g;

export function isDiscordIDValid(str: string) {
  return str.match(regexDiscordID) !== null;
};

export function extractDiscordID(str: string) {
  const matches = str.match(regexDiscordID);
  return matches?.at(0) ?? null;
};

export function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
};

export async function transformMessage(client: Client, message: PossiblyUncachedMessage | null) {
  if (!message) {
    return null;
  };

  if (message instanceof Message) {
    return message as Message<Uncached | AnyTextableGuildChannel>;
  };

  try {
    let restMessage = await client.rest.channels.getMessage<AnyTextableGuildChannel>(message.channel.id, message.id);
    if (restMessage) return restMessage;
  } catch (error) {
    console.error(error);
  };

  return null;
};

export function usernameHandle(user: Member | Member["user"]) {
  return user.discriminator === "0" ? `@${user.username}` : `${user.username}#${user.discriminator}`;
};

export function truncate(str: string, len: number) {
  return (str.length >= len) ? str.substring(0, len - 1) + '...' : str;
};

export function shuffle<T>(array: T[]): T[] {
  for (let index = array.length - 1; index > 0; index--) {
		const newIndex = randomInt(0, (index + 1));
		[array[index], array[newIndex]] = [array[newIndex] as T, array[index] as T];
	};

	return array;
};

export function randomNumber(min: number, max: number) {
  return randomInt(Math.floor(min), Math.ceil(max) + 1);
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
  // limit 3
  switch (true) {
    case magnitude >= 3 && magnitude <= 3.9: return 0xffbb6b;
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

export function isInIndonesia(lat: number, lng: number) {
  return lat >= -11.0 && lat <= 6.0 && lng >= 95.0 && lng <= 141.0;
};