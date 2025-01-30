import {Message, AnyTextableGuildChannel, PrivateChannel, GuildChannel} from "oceanic.js";

// Moderation Registry
// import ChannelCooldown from "../registry/channelCooldown";

// invite link trigger word
import inviteLinkTriggerWord from "../registry/inviteLinkTriggerWord";

export default async (_, message: Message<AnyTextableGuildChannel>) => {
  if (
    message.author.bot ||
    message.channel instanceof PrivateChannel ||
    !(message.channel instanceof GuildChannel)
  ) return;

  // if (mostCooldownRelevantTextChannelIDs.some(channelID => channelID === message.channel.id)) {
  //   ChannelCooldown(client, message);
  // };

  inviteLinkTriggerWord(message);

  if (message.content.startsWith(evalPrefix + "eval")) {
    let args = message.content.slice(evalPrefix.length).trim().split(/ +/g);
    args.shift()?.toLowerCase();

    return EvalFactory(client, message, args);
  };


};