import {GMDIExtension, Message, Uncached, AnyGuildTextChannel} from "oceanic.js";

export type PossiblyUncachedMessage = Message<AnyGuildTextChannel> | { channel: AnyGuildTextChannel | Uncached; id: string };

import contentLogging from "../registry/contentLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: GMDIExtension, message: PossiblyUncachedMessage) => {
  contentLogging(client, message);

  ghostPing(client, message);
};