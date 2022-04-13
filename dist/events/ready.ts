import Eris from "eris";
import GMDIBot from "../handler/Client";
import PrayerTiming from "../factory/PrayerTiming";

// Moderation Registry
import removalChannelCooldown from "../moderationRegistry/removalChannelCooldown";

export default async (client: GMDIBot) => {
  client.editStatus("idle", {type: Eris.Constants.ActivityTypes.WATCHING, name: "Love Live"});

  console.log("Ready.");

  removalChannelCooldown(client);

  // prayer reminder
  PrayerTiming(client);
};