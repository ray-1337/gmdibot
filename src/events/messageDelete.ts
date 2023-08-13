import {GMDIExtension, Message, Uncached, AnyTextableGuildChannel} from "oceanic.js";

export type PossiblyUncachedMessage = Message<AnyTextableGuildChannel> | { channel: AnyTextableGuildChannel | Uncached; id: string };

// import contentLogging from "../registry/contentLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: GMDIExtension, message: PossiblyUncachedMessage) => {
  // contentLogging(client, message);

  ghostPing(client, message);
};