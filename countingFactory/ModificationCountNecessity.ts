import Eris from "eris";
import Config from "../config";
import GMDIBot from "../handler/Client";
import db from "quick.db";

export default async function (client: Eris.Client & GMDIBot, message: Eris.Message, oldMessage?: Eris.OldMessage) {
  try {
    if (client.cache.get(`countingMCNPrevention.${message.id}`) as boolean === true || message.channel.id !== Config.counting.channelID || client.counter.state.get("prepping") === true || message.member?.user.bot) return;

    let countingChannel = client.getChannel(Config.counting.channelID) as Eris.GuildTextableChannel;

    const messageIDList = db.get("countingMessageIDList");

    const prepping = () => {
      db.set("countingState", 0);
      client.counter.state.set("prepping", true);
      setTimeout(() => {
        client.counter.state.delete("prepping");
        countingChannel.createMessage("Persiapan sistem counting sudah direset. Silahkan ulang dari \"0\" (nol).");
      }, 30000);
      return;
    };

    // candidate exclude
    if (Config.counting.dedicated.some(x => x === message.author.id)) {
      // important/urgent messages
      if (/(\[C1\])/gi.test(message.content)) return;
      
      return;
    };

    // edit
    if (oldMessage !== undefined) {
      if (oldMessage.content) {
        if (oldMessage.content !== message.content && messageIDList.some((x: string) => x === message.id)) {
          prepping();
          return countingChannel.createMessage(`User dari ${message.member?.mention || `<@!${message.member?.id}>`} telah *memodifikasi* jejak countingnya. Counter akan direset dari nol lagi.`);
        };
      }
    };

    // delete
    if (message && oldMessage === undefined && messageIDList.some((x: string) => x === message.id)) {
      prepping();
      return countingChannel.createMessage(`User dari ${message.member?.mention || `<@!${message.member?.id}>`} telah *menghapus* jejak countingnya. Counter akan direset dari nol lagi.`);
    };
  } catch (err) {
    console.error(err);
  };
};