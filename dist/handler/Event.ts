import { readdir } from "node:fs/promises";
import { GMDIExtension, ClientEvents } from "oceanic.js";
import { resolve, join } from "node:path";

export default async (client: GMDIExtension) => {
  let path = resolve(__dirname, "..", "events");
  const eventList = await readdir(path);

	for (let event of eventList) {
		try {
      const eventImport = await import(join(path, event));
      if (typeof eventImport.default !== "function" || !eventImport?.default) continue;
      
      client.on(event.split('.')[0] as keyof ClientEvents, (...args) => eventImport.default(client, ...args));
    } catch {
      continue;
    };
	};
};