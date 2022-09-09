import { GMDIExtension, GuildChannel, AnyGuildTextChannel } from "oceanic.js";
import Config from "../config/config";

export default async (client: GMDIExtension) => {
  if (process.argv.slice(2)[0] === "--dev") console.log("removalGeneralCooldown ready");

  setInterval(() => {
    for (const channelID of Config.channel.watchChannelModeration) {
      if (!client.cache.get(`slowmode.${channelID}`)) return;

      if (client.getChannel(channelID) instanceof GuildChannel) {
        let messages = [...(client.getChannel(channelID) as AnyGuildTextChannel).messages.values()]
        .filter(m => new Date(m.timestamp).getTime() > (Date.now() - Config.cooldown.timerange));

        let limit = Config.cooldown.limit.cooling;

        // removal
        if (messages.length <= limit) {
          client.cache.del(`slowmode.${channelID}`);
          client.rest.channels.edit(channelID, { rateLimitPerUser: 0, reason: "Normal Traffic" });

          client.rest.channels.createMessage(Config.channel.modlog, {
            embeds: [{
              description: `Removed from ${client.getChannel(channelID)?.mention}`,
              title: "Normalized Traffic",
              color: 0x50C9AA
            }]
          });

          client.rest.channels.createMessage(channelID, {
            content: Config.cooldown.message.cooling[Math.floor(Math.random() * Config.cooldown.message.cooling.length)]
          });

          return;
        };
      };
    };
  }, Config.cooldown.intervalCheckingTimeout);
};