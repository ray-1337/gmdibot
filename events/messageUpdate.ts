import Eris from "eris";
import Config from "../config";
import GMDIBot from "../handler/Client";

import ModificationCountNecessity from "../countingFactory/ModificationCountNecessity";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message, oldMessage: Eris.OldMessage) => {
  // ignore
  if (message.author === client.user || message.author?.bot) return;

  // one word story
  // if (Config.channel.onewordstory.includes(message.channel.id)) {
  //   client.emit("oneWordStory", message);
  // };

  // counting system
  if (message.channel.id === Config.counting.channelID) {
    ModificationCountNecessity(client, message, oldMessage);
  };
};