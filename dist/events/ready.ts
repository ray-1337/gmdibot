import {GMDIExtension, Constants} from "oceanic.js";
import redis from "../Cache";

// bmkg features
import bmkgNotification from "../registry/bmkgNotification";
import bmkgNotificationRealtime from "../registry/bmkgNotification.realtime";

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

      // await bmkgNotification(client);

      await bmkgNotificationRealtime(client);
    } catch (error) {
      return console.error(error);
    };
  };
};