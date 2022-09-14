import {GMDIExtension, Message, AnyGuildTextChannel, JSONMessage} from "oceanic.js";

import ghostPing from "../registry/ghostPing";
import viprin from "../registry/viprin";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>, oldMessage?: JSONMessage | null) => {
  ghostPing(client, message, oldMessage);
  
  // requested by Lipz
  viprin(client, message);
};