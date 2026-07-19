import type { Message, AnyTextableGuildChannel } from "oceanic.js";

const honeypotChannelId: string = "1528387595049107576";

export default async function initiateHoneypot(message: Message<AnyTextableGuildChannel>) {
  if (
    message.channelID !== honeypotChannelId || // ignore non-honeypot channel
    message.member.permissions.has("KICK_MEMBERS") // ignore a member that had a permission to kick members
  ) {
    return;
  };

  await message.member.kick("Interacting with honeypot channel.");

  return;
};