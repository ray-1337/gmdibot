import {GMDIExtension, Message, AnyGuildTextChannel, PartialEmoji, Member, Uncached, User} from "oceanic.js";
import Starboard from "../registry/starboard";

export default async (client: GMDIExtension, msg: Message<AnyGuildTextChannel>, reactor: Uncached | User | Member, emoji: PartialEmoji) => {
  Starboard(client, msg, emoji, reactor);
};