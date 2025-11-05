import type { Member, JSONMember, Client } from "oceanic.js";

import { randomNumber } from "@/handler/Util";
import { gmdiGuildID } from "@/handler/Config";

const cachedSurnames = new Set<string>();
const fallbackName: string = "biar bisa di @";

export default async function(client: Client, user: Member | Member["user"], oldUser: JSONMember | JSONMember["user"] | null) {
  try {
    if (!oldUser) {
      return;
    };

    // must be at least 3 alphanumeric characters
    const regex = /[\d\w]{3,}/gim;

    if (("nick" in user && "nick" in oldUser) && (user.nick !== null && user.nick !== oldUser?.nick) && !user.nick.match(regex)) {
      const nick = await getCommonSurname() || fallbackName;

      await user.edit({ nick });

      return;
    };

    if (("globalName" in user && "globalName" in oldUser)) {
      let oldUsername = user.globalName == null && user.username !== oldUser.username;
      let newUsername = user.globalName !== null && user.globalName !== oldUser?.globalName;

      if ((oldUsername && !user.username.match(regex)) || (newUsername && !user?.globalName?.match(regex))) {
        const nick = await getCommonSurname() || fallbackName;

        await client.rest.guilds.editMember(gmdiGuildID, user.id, { nick });

        return;
      };
    };
  } catch (error) {
    console.error(error);
  };

  return;
};

async function getCommonSurname() {
  if (cachedSurnames.size <= 0) {
    const endpoint = "https://gist.githubusercontent.com/maulvi/e443e22b82a1dc24e14344b47f0a80ea/raw/b8465b38366622daad2d841054ad155d16c5c3a5/nama.txt";
    const request = await fetch(endpoint);
    if (!request.ok) return null;
    
    const data = await request.text();

    data.split(/[\n]/gim).forEach(name => cachedSurnames.add(name.trim()));
  };

  const array = Array.from(cachedSurnames);
  const randomizedValue = array[randomNumber(0, array.length)];

  return (
    typeof randomizedValue === "string" ?
    (randomizedValue.charAt(0).toUpperCase() + randomizedValue.slice(1)) :
    null
  );
};