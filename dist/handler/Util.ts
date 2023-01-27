import { GMDIExtension, Message, AnyGuildTextChannel } from "oceanic.js";
import {randomBytes} from "crypto";
import {PossiblyUncachedMessage} from "../events/messageDelete";

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