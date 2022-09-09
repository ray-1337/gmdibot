import {Constants, ActionRowBase, GMDIExtension, Message, AnyGuildTextChannel, PartialEmoji, Member, Uncached, User, EmbedOptions, File, MessageActionRow} from "oceanic.js";
import ms from "ms";
import normalizeURL from "normalize-url";
import * as Util from "../handler/Util";

export default async (client: GMDIExtension, msg: Message<AnyGuildTextChannel>, emoji: PartialEmoji, reactor: Uncached | User | Member) => {
  try {
    // must be presented in guild
    if (!msg.guildID || !msg?.channel?.id) return;

    if (reactor instanceof Member) {
      if (reactor.bot) return;
    };

    // check message
    let message = await Util.transformMessage(client, msg);
    if (!message) return;

    const starEmoji = "⭐";
    const channelID = "954291153203769354";

    // message older than Jan 1 2022 will be ignored
    // let _2022 = new Date("Jan 1 2022").getTime();
    // if (message.createdAt < _2022) return;

    // if (message.content.replace(/[a-zA-Z]/g, "").length < totalCharLengthMinimum) return;
    if (message.channel.id == channelID) return; // star in the same channel
    if (!message.reactions[starEmoji]) return; // not star emoji
    if (message.reactions[starEmoji].me) return; // bot

    let reactions = await client.rest.channels.getReactions(message.channel.id, message.id, starEmoji);

    // starboard starter
    let starterQueryKey = `starboardStarter_${message.id}`;
    let starterQuery = await client.database.get(starterQueryKey);
    if (reactions.length == 1) {
      if (!starterQuery) await client.database.set(starterQueryKey, reactions[0].id);
    } else if (reactions.length <= 0) {
      if (starterQuery) await client.database.delete(starterQueryKey);
    };

    // star emoji validation
    let _maxR = 9, _minR = 6;
    let limit = client.cache.get<number | null>(`sLC_${message.id}`);
    if (!limit || isNaN(limit)) {
      let randLimit = Math.floor(Math.random() * (_maxR - _minR) + _minR);
      limit = randLimit;
      client.cache.set(`sLC_${message.id}`, randLimit, Math.round(ms("1h") / 1000));
    };

    // increment if same user reacted
    if (reactions.find(val => message && (message.author.id == val.id))) ++limit;

    if (message.reactions[starEmoji].count >= limit) {
      if (client.database.has("postedStarboard")) {
        let check = client.database.get("postedStarboard") as string[] | null;
        if (check) {
          if (check.includes(message.id)) return;
          else client.database.push("postedStarboard", message.id);
        } else {
          return;
        };
      } else {
        client.database.set("postedStarboard", [message.id]);
      };

      const embed: EmbedOptions = {
        color: 0xffac33,
        timestamp: new Date(message.timestamp).toISOString(),
        description: Util.truncate(message.content, 4096),
        author: {
          name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`,
          iconURL: message.author.avatarURL("png", 16)
        }
      };

      if (starterQuery) {
        let starterUser = client.users.get(starterQuery) || await client.rest.users.get(starterQuery).catch(() => { });
        if (starterUser) {
          embed.footer!["text"] = `Si Pemulai: ${starterUser.username}#${starterUser.discriminator}`;
        };
      };

      let file: File | undefined;

      let embeddings: string[] = [];

      if (message.attachments.size || message.embeds.length) {
        let ext = {
          "image/gif": ".gif",
          "image/jpeg": ".jpeg",
          "image/jpg": ".jpg",
          "image/png": ".png",
          "image/webp": ".webp",
          "video/mp4": ".mp4",
          "video/webm": ".webm"
        };

        // attachments
        if (message.attachments.size == 1) {
          if (message.attachments[0].content_type?.match(/^(image\/(jpe?g|gif|png|webp))/gi)) {
            embed.image!["url"] = normalizeURL(message.attachments[0].url);
          }

          else if (message.attachments[0].content_type?.match(/^(video)/gi)) {
            embeddings.push(normalizeURL(message.attachments[0].url));
          };
        } else if (message.attachments.size > 1) {
          for (let data of message.attachments) {
            if (!data[1].contentType) continue;

            if (Object.keys(ext).find(mime => mime == data[1].contentType)) {
              embeddings.push(data[1].url);
            };

            continue;
          };
        };

        // embeds
        if (message.embeds.length == 1) {
          if (message.embeds[0].type == "image" && message.embeds[0].url) {
            embed.image!.url = normalizeURL(message.embeds[0].url);
          }

          else if (message.embeds[0].type == "video" && message.embeds[0].url) {
            embeddings.push(normalizeURL(message.embeds[0].url));
          };
        } else if (message.embeds.length > 1) {
          for (let data of message.embeds) {
            if (data[1].type.match(/(image|video)/gi) && data.url) {
              embeddings.push(data.url);
            };

            continue;
          };
        };
      };

      let redirectButton: MessageActionRow[] = [{
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [{
          type: Constants.ComponentTypes.BUTTON,
          style: Constants.ButtonStyles.LINK,
          label: "Dokumen Asli",
          url: `https://discord.com/channels/${message.guildID}/${message.channel.id}/${message.id}`
        }]
      }];

      const embedMsg = await client.rest.channels.createMessage(channelID, {
        embeds: [embed],
        components: embeddings.length ? undefined : redirectButton,
        files: file ? [file] : undefined
      });

      if (embeddings.length) {
        client.rest.channels.createMessage(channelID, {
          content: embeddings.join("\n"),
          components: embeddings.length ? redirectButton : undefined,
          messageReference: {
            messageID: embedMsg.id,
            channelID: channelID,
            failIfNotExists: false,
            guildID: embedMsg.guildID
          }
        });
      };
    };
  } catch (error) {
    return console.error(error);
  }
};