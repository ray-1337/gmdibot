import Eris from "eris";
import Client from "../handler/Client";
import Config from "../config";

export = async (client: Client) => {
  if (process.argv.slice(2)[0] === "--dev") console.log("removalGeneralCooldown ready");

  setInterval(() => {
    for (const channelID of Config.channel.watchChannelModeration) {
      if (!client.cache.get(`slowmode.${channelID}`)) return;

      if (client.getChannel(channelID) instanceof Eris.GuildChannel) {
        let messages = [...(client.getChannel(channelID) as Eris.GuildTextableChannel).messages.values()].filter(m => m.timestamp > (Date.now() - Config.cooldown.timerange));
        let limit = Config.cooldown.limit.cooling;

        // removal
        if (messages.length <= limit) {
          client.cache.del(`slowmode.${channelID}`);
          client.editChannel(channelID, { rateLimitPerUser: 0 }, "Normal Traffic");

          client.createMessage(Config.channel.modlog, {
            embeds: [
              new Eris.RichEmbed().setDescription(`Removed from ${client.getChannel(channelID).mention}`).setTitle("Normalized Traffic").setColor(0x50C9AA)
            ]
          });

          client.createMessage(channelID, Config.cooldown.message.cooling[Math.floor(Math.random() * Config.cooldown.message.cooling.length)]);

          return;
        };
      };
    };
  }, Config.cooldown.timeout);
};