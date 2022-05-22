import fs from "fs";
import Eris from "eris";

export default async (client: Eris.Client) => {
  const events = await fs.promises.readdir("./dist/events/");

  for (const evt of events) client.on(evt.split(".")[0], (...args) => require(`../events/${evt}`).default(client, ...args));
};