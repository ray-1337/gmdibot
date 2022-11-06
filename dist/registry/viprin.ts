import { GMDIExtension, Message, AnyGuildTextChannel } from "oceanic.js";

let temp: Record<string, true> = {};

export default async (_: GMDIExtension, message: Message<AnyGuildTextChannel>) => {
  return;
  
  if (!message || message.author.bot || !message?.embeds?.length || temp[message.id]) return;

  const timestamp = Date.now() - new Date(message.createdAt).getTime();
  const totalTimestamp = Math.round(((timestamp % 864e5) % 36e5) / 6e4);
  if (totalTimestamp >= 5) return;

  const youtube = message.embeds.filter(val => val.provider?.name?.toLowerCase() == "youtube");
  if (!youtube?.length) return;

  const viprin = youtube.find(val => val.author?.name?.toLowerCase() == "viprin");
  if (viprin) {
    temp = {...temp, ...{ [message.id]: true }};

    return message.channel.createMessage({
      content: "Yah brengsek ada Viprin anjing ga mood gw kontol banget anjing simpatisan RobTop dateng, jembut bangsat",
      messageReference: {
        messageID: message.id,
        channelID: message.channel.id,
        guildID: message.channel.guildID,
        failIfNotExists: false
      }
    });
  };
};