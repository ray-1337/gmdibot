import Eris from "eris";
import config from "../config";

export = async (client: Eris.Client, message: Eris.Message) => {
  // ignore
  if (message.author.bot) return;

  if (config.channel.watchChannelModeration.some(x => x === message.channel.id)) {
    client.emit("channelCooldown", message);
  };

  // one word story
  if (config.channel.onewordstory.some(x => x === message.channel.id)) {
    client.emit("oneWordStory", message);
  };
};