import {GMDIExtension, Message, AnyGuildTextChannel, PrivateChannel, GuildChannel} from "oceanic.js";
import Config from "../config/config";

// Forgotten Member Role
import forgottenMemberRole from "../registry/forgottenMemberRole";

// command
import EvalFactory from "../registry/eval";

// freedom
import Freedom from "../registry/freedom";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>) => {
  if (
    message.author.bot ||
    message.channel instanceof PrivateChannel ||
    !(message.channel instanceof GuildChannel)
  ) return;

  Freedom(client, message)

  forgottenMemberRole(message);

  const args = message.content.slice(Config.prefix.length).trim().split(/ +/g); args.shift();

  if (message.content.startsWith(Config.prefix + "eval")) {
    return EvalFactory(client, message, args);
  };
};