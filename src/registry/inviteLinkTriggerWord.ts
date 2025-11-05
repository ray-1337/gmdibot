import { Message, AnyTextableGuildChannel } from "oceanic.js";
import { channel, channelSets } from "../handler/Config";
import ms from "ms";

let lastTriggered = new Map<string, number>();
let cooldown: number = ms("1h");

export default async (message: Message<AnyTextableGuildChannel>) => {
  // should be triggered in a channel that registered under "Lounge" category channel only
  if (
    (typeof message.channel.parentID === "string" && channelSets.privateCategory.includes(message.channel.parentID)) ||
    !message.content.match(/(?=.*invite)(?=.*link).*/gim)
  ) {
    return;
  };

  const current = lastTriggered.get(message.author.id);
  if (typeof current === "number" && ((Date.now() - current) <= cooldown)) {
    return;
  };

  const prevMessage = await message.channel.createMessage({
    content: `Halo! Silahkan kunjungi <#${channel.inviteLink}> untuk mendapatkan tautan/link berupa undangan ke Discord server ini!`,
    allowedMentions: {
      repliedUser: true,
      users: true
    },
    messageReference: {
      messageID: message.id,
      failIfNotExists: false
    }
  });

  setTimeout(() => prevMessage.delete("[GMDIBot] Occurs one time"), ms("1m"));

  return lastTriggered.set(message.author.id, Date.now());
};