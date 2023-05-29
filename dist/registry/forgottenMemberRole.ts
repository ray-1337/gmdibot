import { Message, AnyGuildTextChannel } from "oceanic.js";
import ms from "ms";
import config from "../handler/Config";

export default async (message: Message<AnyGuildTextChannel>) => {
  if (message.guildID !== config.guildID) return;

  const memberRole = "312868594549653514";

  const day = ms("1d"), dayLimit = 30, age = Date.now() - new Date(message.member.createdAt).getTime();

  if (
    Math.round(age / day) > dayLimit && // pass 30 days discord account age
    !message.member.pending && // not in verification (membership screenings)
    !message.member.roles.includes(memberRole) // currently dont have member role
  ) {
    try {
      await message.member.addRole(memberRole, "Belum dikasih.");
    } catch (error) {
      console.error(error);
      return;
    };
  };
};