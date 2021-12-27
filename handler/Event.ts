import fs from "fs";
import Eris from "eris";

export default async (client: Eris.Client) => {
  const events = fs.readdirSync("./events/"), custom_events = fs.readdirSync("./custom_events/");
  for (const event of events) {
    client.on(event.split(".")[0], (...args) => require(`../events/${event}`)(client, ...args));
  };
  
  for (const event of custom_events) {
    client.on(event.split(".")[0], (...args) => require(`../custom_events/${event}`)(client, ...args));
  };
};