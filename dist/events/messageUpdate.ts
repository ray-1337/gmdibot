import {GMDIExtension, Message, AnyGuildTextChannel, JSONMessage} from "oceanic.js";

import ghostPing from "../registry/ghostPing";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>, oldMessage?: JSONMessage | null) => {
  ghostPing(client, message, oldMessage);
};