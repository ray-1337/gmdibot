import { GMDIExtension, Constants } from "oceanic.js";

// bmkg features
// import prayerTiming from "../registry/prayerTiming";
import bmkgNotificationRealtime from "../registry/bmkgNotification.realtime";

// Moderation Registry
import removalChannelCooldown from "../registry/removalChannelCooldown";

let isReady: boolean = false;

export default async (client: GMDIExtension) => {
  client.editStatus("idle", [{
    type: Constants.ActivityTypes.LISTENING,
    name: "Dosen"
  }]);

  if (!isReady) {
    console.log("Ready.");
  } else {
    isReady = true;
  };

  removalChannelCooldown(client);

  // cache (redis) startup
  try {
    await bmkgNotificationRealtime(client);
  } catch (error) {
    return console.error(error);
  };
};