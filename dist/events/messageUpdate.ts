import {GMDIExtension, Message, AnyTextableGuildChannel, JSONMessage} from "oceanic.js";

import ghostPing from "../registry/ghostPing";

export default async (client: GMDIExtension, message: Message<AnyTextableGuildChannel>, oldMessage?: JSONMessage | null) => {
  ghostPing(client, message, oldMessage);
};