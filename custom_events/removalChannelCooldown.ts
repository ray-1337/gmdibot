import Eris from "eris";
import Client from "../handler/Client";
import Config from "../config";
import cache from "node-cache";

export = async (client: Client) => {
  if (process.argv.slice(2)[0] === "--dev") console.log("removalGeneralCooldown ready");

  setInterval(() => {
    for (const channelID of Config.channel.watchChannelModeration) {
      if (!client.cache.get(`slowmode.${channelID}`)) return;

      if (client.getChannel(channelID) instanceof Eris.TextChannel) {
        let messages = [...(client.getChannel(channelID) as Eris.TextChannel).messages.values()].filter(m => m.timestamp > (Date.now() - 60000));
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