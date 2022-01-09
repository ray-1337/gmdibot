import Eris from "eris";
import Config from "../config";
import GMDIBot from "../handler/Client";
import db from "quick.db";

export default async function (client: Eris.Client & GMDIBot, message: Eris.Message, oldMessage?: Eris.OldMessage) {
  if (client.cache.get(`countingMCNPrevention.${message.id}`) as boolean === true || message.channel.id !== Config.counting.channelID || client.counter.state.get("prepping") === true || message.author.bot) return;

  let countingChannel = client.getChannel(Config.counting.channelID) as Eris.GuildTextableChannel;

  const prepping = () => {
    db.set("countingState", 0);
    client.counter.state.set("prepping", true);
    setTimeout(() => {
      client.counter.state.delete("prepping");
      countingChannel.createMessage("> Persiapan sistem counting sudah direset. Silahkan ulang dari \"0\".");
    }, 30000);
  };
  // edit
  if (oldMessage !== undefined) {
    if (oldMessage.content) {
      if (oldMessage.content !== message.content) {
        prepping();
        return countingChannel.createMessage(`User dari ${message.member?.mention} telah *memodifikasi* jejak countingnya. Counter akan direset dari nol lagi.`);
      };
    }

    else return;
  };

  // delete
  if (message) {
    prepping();
    return countingChannel.createMessage(`User dari ${message.member?.mention} telah *menghapus* jejak countingnya. Counter akan direset dari nol lagi.`);
  };
};