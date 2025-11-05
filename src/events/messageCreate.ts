import { Message, AnyTextableGuildChannel, GuildChannel } from "oceanic.js";

// invite link trigger word
import inviteLinkTriggerWord from "../registry/inviteLinkTriggerWord";

export default async (_, message: Message<AnyTextableGuildChannel>) => {
  if (message.author.bot || !(message.channel instanceof GuildChannel)) return;

  inviteLinkTriggerWord(message);
};