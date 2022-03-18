import Eris from "eris";
import Config from "../config/config";
import GMDIBot from "../handler/Client";
import { stripIndents } from "common-tags";

export default async function (client: Eris.Client & GMDIBot, message: Eris.Message) {
  if (message.channel.id !== Config.counting.channelID || client.counter.state.get("prepping") === true || message.author.bot) return;

  let countingChannel = client.getChannel(Config.counting.channelID) as Eris.GuildTextableChannel;

  if (message.channel.messages.limit !== Config.counting.messageCacheLimit) {
    message.channel.messages.limit = Config.counting.messageCacheLimit;
  };

  // endpoint start
  client.database.has("countingState") ? null : client.database.set("countingState", 0);

  const prepping = () => {
    client.database.set("countingState", 0);
    client.counter.state.set("prepping", true);
    setTimeout(() => {
      client.counter.state.delete("prepping");
      countingChannel.createMessage("Persiapan sistem counting sudah diatur ulang. Silahkan ulang dari \"0\" (nol).");
    }, 30000);
  
    return;
  };

  // the dedicated user resets
  if (Config.counting.dedicated.some(x => x === message.author.id)) {
    // important/urgent messages
    if (/(\[C1\])/gi.test(message.content)) return;
    
    prepping();
    return countingChannel.createMessage({
      content: "Counter akan direset dari nol lagi.",
      messageReference: {messageID: message.id}
    });
  };

  // wrong
  // you cant use isNaN, thats how typescript works lmao
  let numberOnlyRegex: RegExp = /\d+$/gi;
  // let previous = [...message.channel.messages.values()].length > 0 ? [...message.channel.messages.values()].filter(x => x.member?.user.bot === false) : await client.getMessages(message.channel.id, {before: message.id, limit: 1});
  let previous = await client.getMessages(message.channel.id, {before: message.id, limit: 1});
  let mistake: boolean[] = [
    parseInt(message.content) !== client.database.get("countingState"),
    !numberOnlyRegex.test(message.content),
    previous[previous.length - 1] !== undefined && previous[previous.length - 1].author.id === message.author.id
  ];

  if (mistake.some(x => x == true)) {
    let userErrorLimit = client.counter.userError.get(message.author.id);
    if (!userErrorLimit) {
      client.counter.userError.set(message.author.id, 1);
      userErrorLimit = client.counter.userError.get(message.author.id);
    };

    if (userErrorLimit !== undefined) {
      if (userErrorLimit < Config.counting.limitError) {
        // prevent MCN fired
        client.cache.set(`countingMCNPrevention.${message.id}`, true);
        client.cache.ttl(`countingMCNPrevention.${message.id}`, 15000);

        // message.delete().catch(() => {});
        message.addReaction("❌");
        client.counter.userError.set(message.author.id, userErrorLimit + 1);
        return countingChannel.createMessage({
          messageReference: {messageID: message.id},
          content: stripIndents`
          Counting tidak sesuai peraturan (saat ini: **${client.database.get("countingState").toLocaleString()}**).
          Kamu memiliki ${userErrorLimit}/${Config.counting.limitError} kesempatan untuk mengulanginya lagi.`
        });
      } else {
        prepping();
        return countingChannel.createMessage("Counting tidak sesuai peraturan. Counter akan direset dari nol lagi.");
      }
    };
  };

  client.database.has("countingMessageIDList") ? 
  client.database.push("countingMessageIDList", message.id) :
  client.database.set("countingMessageIDList", [message.id]);

  client.database.set("countingState", client.database.get("countingState") + 1);

  return;
};