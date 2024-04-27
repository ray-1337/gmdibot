import {Client, Message, AnyTextableGuildChannel} from "oceanic.js";
import { modlogChannelID, cooldownRangeExceed, messagesCacheTimeRange, cooldownMessageExceed } from "../handler/Config";
import { getRandomInt } from "../handler/Util";

export const slowmodeChannel = new Map<string, boolean>();

export default async (client: Client, message: Message<AnyTextableGuildChannel>) => {
  let messages = [...message.channel.messages.values()].filter(m => new Date(m.timestamp).getTime() >= (Date.now() - messagesCacheTimeRange));

  // Applies
  if (messages.length >= cooldownRangeExceed && !slowmodeChannel.has(`slowmode.${message.channel.id}`)) {
    slowmodeChannel.set(message.channel.id, true);

    client.rest.channels.edit(message.channel.id, {
      rateLimitPerUser: getRandomInt(5, 15),
      reason: "High Traffic"
    }).catch(() => {});

    client.rest.channels.createMessage(modlogChannelID, {
      embeds: [{
        description: `Applied on ${client.getChannel(message.channel.id)?.mention}`,
        title: "High Traffic Warning",
        color: 0x121112
      }]
    });

    client.rest.channels.createMessage(message.channel.id, {
      content: cooldownMessageExceed[Math.floor(Math.random() * cooldownMessageExceed.length)]
    });

    return;
  };
};