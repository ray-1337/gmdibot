import Eris from "eris";
import Starboard from "../registry/starboard";

export default async (client: Eris.GMDIExtension, msg: Eris.Message<Eris.GuildTextableChannel>, emoji: Eris.PartialEmoji, reactor: Eris.Member | { id: string }) => {
  Starboard(client, msg, emoji, reactor);
};