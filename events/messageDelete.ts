import Eris from "eris";
import Config from "../config";
import GMDIBot from "../handler/Client";

import contentLogging from "../moderationRegistry/contentLogging";
import ModificationCountNecessity from "../countingFactory/ModificationCountNecessity";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message) => {
  // console.log(message);
  contentLogging(client, message);

  // counting system
  if (message.channel.id === Config.counting.channelID) {
    ModificationCountNecessity(client, message);
  };
};