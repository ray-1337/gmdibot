import fs from "fs";
import Eris from "eris";

export default async (client: Eris.Client) => {
  const events = fs.readdirSync("./events/"), custom_events = fs.readdirSync("./moderationRegistry/");

  for (const evt of events) client.on(evt.split(".")[0], (...args) => require(`../events/${evt}`)(client, ...args));
  
  for (const evt of custom_events) client.on(evt.split(".")[0], (...args) => require(`../moderationRegistry/${evt}`)(client, ...args));
};