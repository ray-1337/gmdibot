import fs from "fs";
import { GMDIExtension, ClientEvents } from "oceanic.js";

export default async (client: GMDIExtension) => {
  const events = await fs.promises.readdir("./dist/events/");

  for (const evt of events) {
    client.on(evt.split(".")[0] as keyof ClientEvents, (...args) => require(`../events/${evt}`).default(client, ...args));
  };
};