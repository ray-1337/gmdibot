import Eris from "eris";
import Config from "../config/config";
import GMDIBot from "../handler/Client";

import contentLogging from "../registry/contentLogging";
import ghostPing from "../registry/ghostPing";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message<Eris.GuildTextableChannel>) => {
  contentLogging(client, message);

  ghostPing(client, message);
};