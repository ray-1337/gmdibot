import Eris from "eris";
import GMDIBot from "../handler/Client";

import ghostPing from "../registry/ghostPing";

export default async (client: Eris.Client & GMDIBot, message: Eris.Message<Eris.GuildTextableChannel>, oldMessage?: Eris.OldMessage) => {
  ghostPing(client, message, oldMessage);
};