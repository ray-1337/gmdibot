import { Client, Constants } from "oceanic.js";

// bmkg features
// import prayerTiming from "../registry/prayerTiming";
import bmkgNotificationRealtime from "../registry/bmkgNotification.realtime";

// Moderation Registry
import removalChannelCooldown from "../registry/removalChannelCooldown";

let isReady: boolean = false;

export default async (client: Client) => {
  if (!isReady) {
    console.log("Ready.");
    isReady = true;
  } else {
    return;
  };

  client.editStatus("idle", [{
    type: Constants.ActivityTypes.LISTENING,
    name: "Dosen"
  }]);

  removalChannelCooldown(client);

  // prayerTiming(client);

  // cache (redis) startup
  try {
    await bmkgNotificationRealtime(client);
  } catch (error) {
    return console.error(error);
  };
};