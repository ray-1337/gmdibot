import {GMDIExtension, Message, AnyTextableGuildChannel, PrivateChannel, GuildChannel} from "oceanic.js";
import { mostCooldownRelevantTextChannelIDs, evalPrefix } from "../handler/Config";

// Moderation Registry
import ChannelCooldown from "../registry/channelCooldown";

// Forgotten Member Role
import forgottenMemberRole from "../registry/forgottenMemberRole";

// command
import EvalFactory from "../registry/eval";

export default async (client: GMDIExtension, message: Message<AnyTextableGuildChannel>) => {
  if (
    message.author.bot ||
    message.channel instanceof PrivateChannel ||
    !(message.channel instanceof GuildChannel)
  ) return;

  if (mostCooldownRelevantTextChannelIDs.some(channelID => channelID === message.channel.id)) {
    ChannelCooldown(client, message);
  };

  forgottenMemberRole(message);

  if (message.content.startsWith(evalPrefix + "eval")) {
    let args = message.content.slice(evalPrefix.length).trim().split(/ +/g);
    args.shift()?.toLowerCase();

    return EvalFactory(client, message, args);
  };
};