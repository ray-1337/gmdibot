import Eris from "eris";
import Client from "../handler/Client";
import Config from "../config";

export = async (client: Client, message: Eris.Message<Eris.GuildTextableChannel>) => {
  // cache limit
  if (message.channel.messages.limit !== Config.cache.limit) message.channel.messages.limit = Config.cache.limit;

  let messages = [...message.channel.messages.values()].filter(m => m.timestamp >= (Date.now() - Config.cooldown.timerange));
  let limit = Config.cooldown.limit.exceed;

  // Applies
  if (messages.length >= limit && !client.cache.get(`slowmode.${message.channel.id}`)) {
    client.cache.set(`slowmode.${message.channel.id}`, true);
    client.editChannel(message.channel.id, { rateLimitPerUser: Config.cooldown.timeout }, "High Traffic").catch(() => {});

    client.createMessage(Config.channel.modlog, {
      embeds: [
        new Eris.RichEmbed()
        .setDescription(`Applied on ${client.getChannel(message.channel.id).mention}`)
        .setTitle("High Traffic Warning")
        .setColor(0x121112)
      ]
    });

    client.createMessage(message.channel.id, Config.cooldown.message.exceed[Math.floor(Math.random() * Config.cooldown.message.exceed.length)]);

    return;
  };
};