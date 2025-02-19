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

  const botDescription: string = `An official Discord bot of Geometry Dash Indonesia. \nCurrently running under version **v${version}**.`;

  try {
    await Promise.all([
      client.application.edit({description: botDescription}),
      initBmkgNotification(client),
      rescheduleBirthdayPeople(client),
      initVerificationEmbed(client)
    ]);
  } catch (error) {
    return console.error(error);
  };
};