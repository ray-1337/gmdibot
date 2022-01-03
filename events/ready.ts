import Eris from "eris";
import CRON from "../factory/CRON";

export = async (client: Eris.Client) => {
  client.editStatus("idle", {type: 3, name: "Geometry Dash Indonesia"});
  console.log("Ready.");

  client.emit("removalChannelCooldown", client);

  // edit guild command
  client.emit("slashCommandProceed", client);

  // cron
  CRON(client);
};