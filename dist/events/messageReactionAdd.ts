import Eris from "eris";
import GMDIBot from "../handler/Client";
import Starboard from "../registry/Starboard";

export default async (client: Eris.Client & GMDIBot, msg: Eris.Message, emoji: Eris.PartialEmoji, reactor: Eris.Member | { id: string }) => {
  Starboard(client, msg, emoji, reactor);
};