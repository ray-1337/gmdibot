import {GMDIExtension, Constants} from "oceanic.js";
import redis from "../Cache";

// Moderation Registry
import removalChannelCooldown from "../registry/removalChannelCooldown";

export default async (client: GMDIExtension) => {
  client.editStatus("idle", [{
    type: Constants.ActivityTypes.COMPETING,
    name: "Comifuro"
  }]);

  console.log("Ready.");

  removalChannelCooldown(client);

  // cache (redis) startup
  try {
    await redis?.ping();
  } catch {
    try {
      await redis.connect();
    } catch (error) {
      return console.error(error);
    };
  };
};