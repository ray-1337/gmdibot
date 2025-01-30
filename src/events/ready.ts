import { Client } from "oceanic.js";
import { version } from "../../package.json";

// bmkg features
import { rescheduleBirthdayPeople } from "../registry/birthdayRole";
import initBmkgNotification from "../registry/bmkgNotification";

import initVerificationEmbed from "../registry/verification/initEmbed";

let isReady: boolean = false;

export default async (client: Client) => {
  if (isReady) {
    return;
  };

  console.log(`The bot is ready with version (v${version})`);
  isReady = true;

  try {
    await Promise.all([
      initBmkgNotification(client),
      rescheduleBirthdayPeople(client),
      initVerificationEmbed(client)
    ]);
  } catch (error) {
    return console.error(error);
  };
};