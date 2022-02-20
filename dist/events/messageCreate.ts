import Eris from "eris";
import Config from "../config/config";
import GMDIBot from "../handler/Client";
import Counting from "../countingFactory/Counting";

// Moderation Registry
import ChannelCooldown from "../moderationRegistry/channelCooldown";
import OWS from "../moderationRegistry/oneWordStory";

// command
import EvalFactory from "../factory/Eval";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message) => {
  // ignore
  if (message.author.bot) return;

  // counting system
  if (message.channel.id === Config.counting.channelID) {
    Counting(client, message);
  };

  if (Config.channel.watchChannelModeration.some(x => x === message.channel.id)) {
    ChannelCooldown(client, message);
  };

  // one word story
  if (Config.channel.onewordstory.some(x => x === message.channel.id)) {
    OWS(client, message);
  };

  let args = message.content.slice(Config.prefix.length).trim().split(/ +/g);
  let cmd = args.shift()?.toLowerCase();

  if (cmd === "eval") {
    return EvalFactory(client, message, args);
  };
};