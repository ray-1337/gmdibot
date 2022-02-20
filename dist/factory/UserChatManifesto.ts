import Eris from "eris";
import db from "quick.db";
import Config from "../config/config";
import GMDIBot from "../handler/Client";
//const asdfjkl = require("asdfjkl").default;

export default async function (client: GMDIBot, message: Eris.Message) {
  if (message.channel instanceof Eris.PrivateChannel) return;
  
  const textChannel = message.channel as Eris.GuildTextableChannel;

  // exclude majority channel categories
  if (Config.userChat.unnecessity.category.some(x => x == textChannel.parentID)) return;

  // exclude specific channel
  if (Config.userChat.unnecessity.channel.some(x => x == textChannel.id)) return;

  // db
  // let userChatDB: UserChatInterface = db.get(userChatQuery);

  // clearance
  let content = message.content.toLowerCase().replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/0-9]+/g, "");

  // blacklist
  const detention = [
    //asdfjkl(content) == true, // gibberish
    content.replace(/\W|\d/gi, "").length < 8, // "only words" replacement + less than 8 characters
    message.author.bot == true, // bot
    client.userChat.cooldown.has(message.author.id) // cooldown
  ];
  
  if (detention.some(x => x == true)) return;

  // cooldown
  client.userChat.cooldown.set(message.author.id, true);
  setTimeout(() => client.userChat.cooldown.delete(message.author.id), 6e4);

  db.add(`userChatRate.${message.author.id}.sum.day`, 1);
  return;
};