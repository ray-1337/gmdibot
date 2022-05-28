import Eris from "eris";

import ghostPing from "../registry/ghostPing";

export default async (client: Eris.GMDIExtension, message: Eris.Message<Eris.GuildTextableChannel>, oldMessage?: Eris.OldMessage) => {
  ghostPing(client, message, oldMessage);
};