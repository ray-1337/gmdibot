import Eris from "eris";
import GMDIBot from "../handler/Client";
// import PrayerTiming from "../registry/PrayerTiming";

// Moderation Registry
import removalChannelCooldown from "../registry/removalChannelCooldown";

export default async (client: GMDIBot) => {
  client.editStatus("idle", {type: Eris.Constants.ActivityTypes.WATCHING, name: "Love Live"});

  console.log("Ready.");

  removalChannelCooldown(client);

  // prayer reminder
  // PrayerTiming(client);
};