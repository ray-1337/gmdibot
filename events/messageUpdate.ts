import Eris from "eris";
import config from "../config";

export = async (client: Eris.Client, message: Eris.Message, oldMessage) => {
  // ignore
  if (message.author.bot) return;

  // one word story
  if (config.channel.onewordstory.includes(message.channel.id)) {
    return client.emit("oneWordStory", message);
  };
};