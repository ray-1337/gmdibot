import {MemberOptions, GMDIExtension, User, Member} from "eris";
import {generateHash} from "../handler/Util";
import Config from "../config/config";

export default async (client: GMDIExtension, user: User | Member) => {
  try {
    const regex = /([\w\d]){2,}/gim;
    const pseudoID = generateHash(8);
    const memberOptions: MemberOptions = {
      nick: `biar bisa ditag ${pseudoID}`
    };
  
    if (user instanceof Member) {
      if (user.bot || user.guild.id !== Config.guildID) return;

      if (user?.nick) {
        if (user.nick.match(regex)) {
          await client.editGuildMember(user.guild.id, user.id, {nick: null});
        } else {
          await client.editGuildMember(user.guild.id, user.id, memberOptions);
        };
      };
    } else {
      if (user.bot) return;

      if (!user.username.match(regex)) {
        await client.editGuildMember(Config.guildID, user.id, memberOptions)
      };
    };

    return;
  } catch (error) {
    return console.error(error);
  };
};