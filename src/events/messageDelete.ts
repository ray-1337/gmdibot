import {GMDIExtension, PossiblyUncachedMessage} from "oceanic.js";

import contentLogging from "../registry/deletedMessageLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: GMDIExtension, message: PossiblyUncachedMessage) => {
  // contentLogging(client, message);

  ghostPing(client, message);
};