import Eris from "eris";
import * as Util from "../handler/Util";
import Config from "../config/config";

export default async (client: Eris.GMDIExtension, user: Eris.User | Eris.Member) => {
  try {
    const regex = /([\w\d]){2,}/gim;
    const pseudoID = Util.generateHash(8);
  
    if (user instanceof Eris.Member) {
      if (user.bot || user.guild.id !== Config.guildID) return;

      if (user?.nick && !user.nick.match(regex)) {
        return client.editGuildMember(user.guild.id, user.id, {
          nick: `biar bisa ditag ${pseudoID}`
        }).catch(() => {});
      };
    } else {
      if (user.bot) return;

      if (!user.username.match(regex)) {
        return client.editGuildMember(Config.guildID, user.id, {
          nick: `biar bisa ditag ${pseudoID}`
        }).catch(() => {});
      };
    }
  } catch (error) {
    console.error(error);
    return;
  };
};