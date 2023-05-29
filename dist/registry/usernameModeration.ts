import { EditMemberOptions, GMDIExtension, User, Member } from "oceanic.js";
import { generateHash } from "../handler/Util";
import { gmdiGuildID } from "../handler/Config";

export default async (client: GMDIExtension, user: User | Member) => {
  try {
    const regex = /([\w\d]){2,}/gim;
    const pseudoID = generateHash(8);
    const memberOptions: EditMemberOptions = {
      nick: `biar bisa ditag ${pseudoID}`
    };
  
    if (user instanceof Member) {
      if (user.bot || user.guild.id !== gmdiGuildID) return;

      if (user?.nick) {
        if (!user.nick.match(regex)) {
          await client.rest.guilds.editMember(user.guild.id, user.id, memberOptions);
        };
      };
    } else {
      if (user.bot) return;

      if (!user.username.match(regex)) {
        await client.rest.guilds.editMember(gmdiGuildID, user.id, memberOptions)
      };
    };

    return;
  } catch (error) {
    return console.error(error);
  };
};