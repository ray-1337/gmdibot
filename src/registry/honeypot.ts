import type { Message, AnyTextableGuildChannel } from "oceanic.js";
import { setTimeout } from "node:timers/promises";

import ms from "ms";

const honeypotChannelId: string = "1528387595049107576";
const reason: string = "Interacting with a honeypot channel.";

export default async function initiateHoneypot(message: Message<AnyTextableGuildChannel>) {
  if (
    message.channelID !== honeypotChannelId || // ignore non-honeypot channel
    message.member.permissions.has("KICK_MEMBERS") // ignore a member that had a permission to kick members
  ) {
    return;
  };

  await message.member.ban({
    reason, deleteMessageSeconds: Math.floor(ms("6h") / 1000)
  });

  await setTimeout(5000);

  await message.guild.removeBan(message.author.id, reason);

  return;
};