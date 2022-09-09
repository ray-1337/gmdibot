import {GMDIExtension, Constants} from "oceanic.js";
// import PrayerTiming from "../registry/PrayerTiming";

// Moderation Registry
import removalChannelCooldown from "../registry/removalChannelCooldown";

export default async (client: GMDIExtension) => {
  client.editStatus("idle", [{
    type: Constants.ActivityTypes.COMPETING,
    name: "Comifuro"
  }]);

  console.log("Ready.");

  removalChannelCooldown(client);

  // prayer reminder
  // PrayerTiming(client);
};