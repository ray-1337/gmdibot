import Eris from "eris";

export = async (client: Eris.Client, message: Eris.Message) => {
  return;
  if (message.content.length <= 0) return;

  // staff excludes
  // if (message.member?.roles.some(x => config.role.staff.includes(x))) return;

  let previous = await client.getMessages(message.channel.id, {before: message.id, limit: 1});

  let limitation: boolean[] = [
    message.content.toLowerCase().includes("\n"), // line break
    !message.content.toLowerCase().match(/[a-zA-Z]/g), // no alphabet
    (!/^(>|\/\/)/gi.test(message.content) && /\s/gi.test(message.content)), // not a comments
    (previous[0].author.id === message.author.id && !/^(>|\/\/)/gi.test(previous[0].content)),
    previous[0].author.id === message.author.id, // same user previous message
    ((!/^(>|\/\/)/gi.test(message.content) && /\s/gi.test(message.content)) && message.channel.id === "581048023950426142" && message.content.length > 22), // exceeded characters (indonesia)
    ((!/^(>|\/\/)/gi.test(message.content) && /\s/gi.test(message.content)) && message.channel.id === "581045521507155969" && message.content.length > 45) // exceeded characters (english)
  ];

  // prevent line break and spacing
  if (limitation.some(x => x === true)) return message.delete();
};