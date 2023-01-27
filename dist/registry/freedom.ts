// every word is a bad word.
// thats how our server moderator mindset works.
// they treat small things as a threat of a society.

import { GMDIExtension, Message, AnyGuildTextChannel } from "oceanic.js";
import {readFile} from "fs/promises";
import path from "path";
import { EOL } from "os";
import replaceSpecial from "replace-special-characters";
import ms from "ms";
import {getRandomInt} from "../handler/Util";

// credits to https://github.com/afrizal423/bad-word-indonesia
const badwordFile = path.join(__dirname, "badword-paralyze.txt");

// if they had warned for 3 times, its best to give them a timeout
// this previously documented on Dyno bot
const cachedPunishment = new Map<string, number>();

let cache: { array: string[], regex: RegExp | null } = {
  array: [] as string[],
  regex: null
};

const lame = [
  "Jangan memicu percakapan yang tidak pantas.",
  "Jangan mengirim konten yang tidak pantas.",
  "Jangan memulai topik yang tidak pantas."
];

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>) => {
  try {
    // delete the message
    async function deleteContent() {
      try {
        console.log("Deleted ", message.content)
        await client.rest.channels.deleteMessage(message.channelID, message.id);

        // add punishment count
        if (!message.member.permissions.has("MANAGE_MESSAGES")) {
          cachedPunishment.set(
            message.author.id,
            (cachedPunishment?.get(message.author.id) ?? 0) + 1
          );
        };
        
        if (cachedPunishment.get(message.author.id)! >= 3) {
          // 15 minutes if lucky, 6 hours if unlucky, no mercy.
          const randomMuteTime = getRandomInt(ms("15m"), ms("6h"));
          const combinedTime = new Date(new Date().getTime() + randomMuteTime);

          await client.rest.guilds.editMember(message.guildID, message.author.id, {
            communicationDisabledUntil: combinedTime.toISOString()
          });

          await client.rest.channels.createMessage(message.channelID, {
            content: `<@!${message.author.id}> telah disenyapkan sampai <t:${Math.round(combinedTime.getTime() / 1000)}:f>.`,
            allowedMentions: { users: true, repliedUser: true }
          });

          return;
        };

        client.rest.channels.createMessage(message.channelID, {
          content: `<@!${message.author.id}> ${lame[Math.floor(Math.random() * lame.length)]}`,
          allowedMentions: { users: true, repliedUser: true }
        })
        .then(x => setTimeout(() => x.delete(), getRandomInt(ms("5s"), ms("25s"))));

        return;
      } catch (error) {
        return console.error(error);
      };
    };

    // requirements
    if (message.author.bot || message.content.length < 4) return;

    // test on dev server first
    if (process.env.npm_lifecycle_event === "dev" && message.guildID !== "861938470841745459") return;

    // cache in memory
    if (!cache.array.length || !cache.regex) {
      const wordRead = await readFile(badwordFile, {encoding: "utf-8"});
      const arrayOneTime = wordRead.split(EOL);

      cache.array = arrayOneTime;
      cache.regex = new RegExp(`(${arrayOneTime.join("|").replace(/\|$/gi, "")/*.replace(/\-$/gi, "\\-")*/})`, "gim");
    };

    // replace bypass
    let content = message.content.toLowerCase();
    if (content.match(/[^\d\w]/gim)) {
      content = replaceSpecial(content);
    };

    // replace numbers if bypass
    content = content
    .replace(/[1]/gim, "i").replace(/[\+]/gim, "t")
    .replace(/[2]/gim, "z")
    .replace(/[3]/gim, "e")
    .replace(/[4]/gim, "a")
    .replace(/[5]/gim, "s")
    .replace(/[6]/gim, "g")
    .replace(/[7]/gim, "j")
    .replace(/[8]/gim, "b")
    .replace(/[9]/gim, "g")
    .replace(/[0]/gim, "o");

    // check by whitespace
    if (content.split(/\s/gim).find(val => cache.array.includes(val))) {
      return deleteContent();
    };

    // check by regex (removing whitespace and check by keyword)
    if (content.replace(/\s/gim, "").match(cache.regex)) {
      return deleteContent();
    };
  } catch (error) {
    console.error(error);
    return;
  };
};