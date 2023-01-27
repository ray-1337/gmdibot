import {GMDIExtension, Message, AnyGuildTextChannel, JSONMessage} from "oceanic.js";

import Freedom from "../registry/freedom";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>, oldMessage?: JSONMessage | null) => {
  Freedom(client, message);
};