import Eris from "eris";
import Config from "../config";
import GMDIBot from "../handler/Client";

import ModificationCountNecessity from "../countingFactory/ModificationCountNecessity";

export = async (client: Eris.Client & GMDIBot, message: Eris.Message) => {
  // console.log(message);
  client.emit("contentLogging", message);

  // counting system
  if (message.channel.id === Config.counting.channelID) {
    ModificationCountNecessity(client, message);
  };
};