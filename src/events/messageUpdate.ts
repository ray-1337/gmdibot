import {Client, Message, AnyTextableGuildChannel, JSONMessage} from "oceanic.js";

import ghostPing from "../registry/ghostPing";

export default async (client: Client, message: Message<AnyTextableGuildChannel>, oldMessage?: JSONMessage | null) => {
  ghostPing(client, message, oldMessage);
};