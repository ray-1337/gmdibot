import Eris from "eris";
import Client from "../handler/Client";
import Config from "../config";

export = async (client: Client, message: Eris.Message<Eris.GuildTextableChannel>) => {
  // cache limit
  if (message.channel.messages.limit !== Config.cache.limit) message.channel.messages.limit = Config.cache.limit;

  let messages = [...message.channel.messages.values()].filter(m => m.timestamp >= (Date.now() - 60000));
  let limit = Config.cooldown.limit.exceed;

  // console.log(`cache_${(message.channel as Eris.TextChannel).name}: ${messages.length}`);

  // Applies
  if (messages.length >= limit && message.channel.rateLimitPerUser /*!db.get(`generalSlow.${message.channel.id}`)*/) {
    client.cache.set(`slowmode.${message.channel.id}`, true);
    client.editChannel(message.channel.id, { rateLimitPerUser: 5 }, "High Traffic");

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