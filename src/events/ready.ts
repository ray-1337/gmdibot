import { Client } from "oceanic.js";
import { version } from "../../package.json";

// bmkg features
// import prayerTiming from "../registry/prayerTiming";
import { rescheduleBirthdayPeople } from "../registry/birthdayRole";
import bmkgNotificationRealtime from "../registry/bmkgNotification.realtime";

import initVerificationEmbed from "../registry/verification/initEmbed";

let isReady: boolean = false;

export default async (client: Client) => {
  if (!isReady) {
    console.log(`The bot is ready with version (v${version})`);
    isReady = true;
  } else {
    return;
  };

  // client.editStatus("idle", [{
  //   type: Constants.ActivityTypes.LISTENING,
  //   name: "Dosen"
  // }]);

  // prayerTiming(client);
  
  rescheduleBirthdayPeople(client);

  // cache (redis) startup
  try {
    await Promise.all([
      bmkgNotificationRealtime(client),

      initVerificationEmbed(client)
    ]);
  } catch (error) {
    return console.error(error);
  };
};