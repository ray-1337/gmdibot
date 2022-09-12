import {GMDIExtension, Message, AnyGuildTextChannel, PartialEmoji, Member, Uncached, User} from "oceanic.js";
import Starboard from "../registry/starboard";

export default async (client: GMDIExtension, message: Message<AnyGuildTextChannel>, reactor: Uncached | User | Member, emoji: PartialEmoji) => {
  Starboard(client, message, emoji, reactor);
};