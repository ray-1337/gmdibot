import {Client, Message, AnyTextableGuildChannel, PartialEmoji, Member, Uncached, User} from "oceanic.js";
import Starboard from "../registry/starboard";

export default async (client: Client, message: Message<AnyTextableGuildChannel>, reactor: Uncached | User | Member, emoji: PartialEmoji) => {
  Starboard(client, message, emoji, reactor);
};