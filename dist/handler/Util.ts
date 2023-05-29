import { GMDIExtension, Message, AnyGuildTextChannel } from "oceanic.js";
import {randomBytes} from "crypto";
import {PossiblyUncachedMessage} from "../events/messageDelete";

import dayjs from "dayjs";
import dayjsTZ from "dayjs/plugin/timezone";
import dayjsUTC from "dayjs/plugin/utc";
dayjs.extend(dayjsTZ);
dayjs.extend(dayjsUTC);

export async function transformMessage(client: GMDIExtension, message: PossiblyUncachedMessage | DeletedMessage | null): Promise<Message<AnyGuildTextChannel> | null> {
  if (message) {
    if (message instanceof Message) {
      return message;
    } else {
      try {
        let restMessage = await client.rest.channels.getMessage(message.channel.id, message.id).catch(() => {});

        if (restMessage) {
          return message = restMessage as Message<AnyGuildTextChannel>;
        } else {
          return null;
        };
      } catch (error) {
        console.error(error);
        return null;
      };
    }
  } else {
    return null;
  };
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

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

export function customInaTime(unparsedTime: string, timezone: string) {
  return dayjs(unparsedTime.replace(/\//gi, "-").replace("  ", "T").split(".").shift()!).tz(timezone);
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