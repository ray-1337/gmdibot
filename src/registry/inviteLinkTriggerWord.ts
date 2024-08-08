import { Message, AnyTextableGuildChannel } from "oceanic.js";
import { inviteLinkChannelID } from "../handler/Config";
import ms from "ms";

let lastTriggered = new Map<string, number>();
let cooldown: number = ms("1h");

export default async (message: Message<AnyTextableGuildChannel>) => {
  // should be triggered in a channel that registered under "Lounge" category channel only
  if (message.channel.parentID !== "360449483282055169") {
    return;
  };

  if (message.content.match(/(?=.*invite)(?=.*link).*/gim) === null) {
    return;
  };

  if (lastTriggered.has(message.author.id)) {
    const current = lastTriggered.get(message.author.id) as number;
    if ((Date.now() - current) <= cooldown) {
      return;
    };
  };

  const prevMessage = await message.channel.createMessage({
    content: `Halo! Silahkan kunjungi <#${inviteLinkChannelID}> untuk mendapatkan tautan/link berupa undangan ke Discord server ini!`,
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

  lastTriggered.set(message.author.id, Date.now());

  return;
};