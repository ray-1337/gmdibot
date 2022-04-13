import Eris from "eris";
import Config from "../config/config";
import GMDIBot from "../handler/Client";

// Moderation Registry
import ChannelCooldown from "../moderationRegistry/channelCooldown";

// command
import EvalFactory from "../factory/Eval";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message) => {
  // ignore
  if (message.author.bot) return;

  if (Config.channel.watchChannelModeration.some(x => x === message.channel.id)) {
    ChannelCooldown(client, message);
  };

  let args = message.content.slice(Config.prefix.length).trim().split(/ +/g);
  let cmd = args.shift()?.toLowerCase();

  if (cmd === "eval") {
    return EvalFactory(client, message, args);
  };
};