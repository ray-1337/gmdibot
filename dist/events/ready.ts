import Eris from "eris";
// import PrayerTiming from "../registry/PrayerTiming";

// Moderation Registry
import removalChannelCooldown from "../registry/removalChannelCooldown";

export default async (client: Eris.GMDIExtension) => {
  client.editStatus("dnd", {type: Eris.Constants.ActivityTypes.WATCHING, name: "Kobo Kanaeru"});

  console.log("Ready.");

  removalChannelCooldown(client);

  // prayer reminder
  // PrayerTiming(client);
};