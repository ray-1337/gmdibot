import Eris from "eris";
import Config from "../config/config";

import contentLogging from "../registry/contentLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: Eris.GMDIExtension, message: Eris.Message<Eris.GuildTextableChannel>) => {
  contentLogging(client, message);

  ghostPing(client, message);
};