import GMDIBot from "../handler/Client";
import CRON from "../factory/CRON";

export = async (client: GMDIBot) => {
  client.editStatus("idle", {type: 3, name: "Anime"});

  console.log("Ready.");

  client.emit("removalChannelCooldown", client);

  // edit guild command
  client.emit("slashCommandProceed", client);

  // cron
  CRON(client);
};