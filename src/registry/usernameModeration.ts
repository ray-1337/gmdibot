import type { Member, JSONMember, Client } from "oceanic.js";
import { randomBytes } from "node:crypto";
import { gmdiGuildID } from "../handler/Config";

export default async function(client: Client, user: Member | Member["user"], oldUser: JSONMember | JSONMember["user"] | null) {
  try {
    if (!oldUser) return;

    // must be at least 3 alphanumeric characters
    const regex = /[\d\w]{3,}/gim;
    const random = randomBytes(3).toString("hex");

    // guildMemberUpdate
    if ("nick" in user && "nick" in oldUser) {
      if (user.nick !== null && user.nick !== oldUser?.nick) {
        if (!user.nick.match(regex)) {
          return user.edit({
            nick: `biar bisa ditag ${random}`
          });
        };
      };
    }
    
    // userUpdate
    if (!("nick" in user) && !("nick" in oldUser)) {
      let oldUsernameSystem = user.globalName == null && user.username !== oldUser.username;
      let newUsernameSystem = user.globalName !== null && user.globalName !== oldUser?.globalName;

      if ((oldUsernameSystem && !user.username.match(regex)) || (newUsernameSystem && !user?.globalName?.match(regex))) {
        return await client.rest.guilds.editMember(gmdiGuildID, user.id, { 
          nick: `biar bisa ditag ${random}`
        });
      };
    };
  } catch (error) {
    return console.error(error);
  };
};