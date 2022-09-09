import {GMDIExtension, Message, AnyGuildTextChannel} from "oceanic.js";

import contentLogging from "../registry/contentLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>) => {
  contentLogging(client, message);

  ghostPing(client, message);
};