import Eris from "eris";
import GMDIBot from "../handler/Client";
import CRON from "../factory/CRON";
import PrayerTiming from "../factory/PrayerTiming";

// Moderation Registry
import removalChannelCooldown from "../moderationRegistry/removalChannelCooldown";
import slashCommandProceed from "../moderationRegistry/slashCommandProceed";

export default async (client: GMDIBot) => {
  client.editStatus("idle", {type: Eris.Constants.ActivityTypes.WATCHING, name: "Love Live"});

  console.log("Ready.");

  removalChannelCooldown(client);

  // edit guild command
  slashCommandProceed(client);

  // cron
  CRON(client);

  // prayer reminder
  PrayerTiming(client);
};