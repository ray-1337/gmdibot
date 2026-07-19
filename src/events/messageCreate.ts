import { Message, AnyTextableGuildChannel, GuildChannel } from "oceanic.js";

import inviteLinkTriggerWord from "../registry/inviteLinkTriggerWord";
import initiateHoneypot from "@/registry/honeypot";

export default async (_, message: Message<AnyTextableGuildChannel>) => {
  if (message.author.bot || !(message.channel instanceof GuildChannel)) return;

  inviteLinkTriggerWord(message);
  initiateHoneypot(message);
};