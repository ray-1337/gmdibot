import Eris from "eris";
import Config from "../config/config";

// Moderation Registry
import ChannelCooldown from "../registry/channelCooldown";

// command
import EvalFactory from "../registry/eval";

export default async (client: Eris.GMDIExtension, message: Eris.Message<Eris.GuildTextableChannel>) => {
  if (
    message.author.bot ||
    message.channel instanceof Eris.PrivateChannel ||
    !(message.channel instanceof Eris.GuildChannel)
  ) return;

  if (Config.channel.watchChannelModeration.some(x => x === message.channel.id)) {
    ChannelCooldown(client, message);
  };

  let args = message.content.slice(Config.prefix.length).trim().split(/ +/g);
  let cmd = args.shift()?.toLowerCase();

  if (cmd === "eval") {
    return EvalFactory(client, message, args);
  };
};