import {Client, PossiblyUncachedMessage} from "oceanic.js";

import contentLogging from "../registry/deletedMessageLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: Client, message: PossiblyUncachedMessage) => {
  contentLogging(client, message);

  ghostPing(client, message);
};