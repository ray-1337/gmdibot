import type { Member, JSONMember, GMDIExtension } from "oceanic.js";
import { randomBytes } from "node:crypto";

export default async function(client: GMDIExtension, user: Member | Member["user"], oldUser: JSONMember | JSONMember["user"] | null) {
  try {
    if (!oldUser) return;

    // must be at least 3 alphanumeric characters
    const regex = /[\d\w]{3,}/gim;
    const random = randomBytes(3).toString("hex");

    if ("nick" in user && "nick" in oldUser) {
      if (user.nick !== null && user.nick !== oldUser?.nick) {
        if (!user.nick.match(regex)) {
          return user.edit({
            nick: `biar bisa ditag ${random}`
          });
        };
      };
    } else {
      // if (user. !== null && user. !== oldUser?.) {
      //   if (!user..match(regex)) {
      //     return user.edit({
      //       nick: random
      //     });
      //   };
      // };
    }
  } catch (error) {
    return console.error(error);
  };
};