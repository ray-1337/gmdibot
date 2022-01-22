import GMDIBot from "../handler/Client";
import CRON from "../factory/CRON";

// Moderation Registry
import removalChannelCooldown from "../moderationRegistry/removalChannelCooldown";
import slashCommandProceed from "../moderationRegistry/slashCommandProceed";

export default async (client: GMDIBot) => {
  client.editStatus("idle", {type: 3, name: "Gayshit Impact"});

  console.log("Ready.");

  removalChannelCooldown(client);

  // edit guild command
  slashCommandProceed(client);

  // cron
  CRON(client);
};