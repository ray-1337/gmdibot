import { GMDIExtension, GuildChannel, AnyTextableGuildChannel } from "oceanic.js";
import { modlogChannelID, checkCooldownRemovalInterval, cooldownRangeCooling, mostCooldownRelevantTextChannelIDs, messagesCacheTimeRange, cooldownMessageCooling } from "../handler/Config";
import { slowmodeChannel } from "./channelCooldown";

export default async (client: GMDIExtension) => {
  setInterval(() => {
    for (const channelID of mostCooldownRelevantTextChannelIDs) {
      if (!slowmodeChannel.has(channelID)) continue;

      if (client.getChannel(channelID) instanceof GuildChannel) {
        let messages = [...(client.getChannel(channelID) as AnyTextableGuildChannel).messages.values()]
        .filter(m => new Date(m.timestamp).getTime() > (Date.now() - messagesCacheTimeRange));

        // removal
        if (messages.length <= cooldownRangeCooling) {
          slowmodeChannel.delete(channelID);
          
          client.rest.channels.edit(channelID, { rateLimitPerUser: 0, reason: "Normal Traffic" });

          client.rest.channels.createMessage(modlogChannelID, {
            embeds: [{
              description: `Removed from ${client.getChannel(channelID)?.mention}`,
              title: "Normalized Traffic",
              color: 0x50C9AA
            }]
          });

          client.rest.channels.createMessage(channelID, {
            content: cooldownMessageCooling[Math.floor(Math.random() * cooldownMessageCooling.length)]
          });

          return;
        };
      };
    };
  }, checkCooldownRemovalInterval);
};