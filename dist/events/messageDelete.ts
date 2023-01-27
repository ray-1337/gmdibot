import {GMDIExtension, Message, Uncached, AnyGuildTextChannel} from "oceanic.js";

export type PossiblyUncachedMessage = Message<AnyGuildTextChannel> | { channel: AnyGuildTextChannel | Uncached; id: string };

export default async (client: GMDIExtension, message: PossiblyUncachedMessage) => {

};