import {Constants, GMDIExtension, Message, AnyTextableGuildChannel, PartialEmoji, Member, Uncached, User, File, MessageActionRow} from "oceanic.js";
import ms from "ms";
import normalizeURL from "normalize-url";
import { transformMessage, truncate } from "../handler/Util";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { QuickDB } from "quick.db";
import path from "node:path";

const cachedStar = new Map<string, number>();

const minStar: number = 6;
const maxStar: number = 9;
const starEmoji = "⭐";
const channelID = "954291153203769354";

export const starboardStorage = new QuickDB({
  filePath: path.join(process.cwd(), "database", "starboard.sqlite")
});

export default async (client: GMDIExtension, msg: Message<AnyTextableGuildChannel>, _: PartialEmoji, reactor: Uncached | User | Member) => {
  try {
    // must be presented in guild
    if (!msg?.channel?.guildID || !msg?.channel?.id) return;

    if (reactor instanceof Member) {
      if (reactor.bot) return;
    };

    // check message
    let message = await transformMessage(client, msg);
    if (!message?.channel) return;

    // message older than Aug 13, 2023 will be ignored
    let breakingChangesDate = new Date("Aug 13 2023").getTime();
    if (message.createdAt.getTime() < breakingChangesDate) return;

    // star in the same channel
    if (message.channel.id == channelID) return;

    // check if the star reaction is in the message
    const starReaction = message.reactions.find(({emoji}) => emoji.name === starEmoji);
    if (!starReaction || starReaction.me) return;

    if (Date.now() - message.createdAt.getTime() >= ms("90d")) return;

    let reactions = await client.rest.channels.getReactions(message.channel.id, message.id, starEmoji);

    // starboard starter
    const firstReactedTable = await starboardStorage.tableAsync("first_reaction");
    let starterQuery = await firstReactedTable.has(message.id);
    if (reactions.length == 1) {
      if (!starterQuery) {
        await firstReactedTable.set(message.id, reactions[0].id);
      };
    } else if (reactions.length <= 0) {
      if (starterQuery) {
        await firstReactedTable.delete(message.id);
      };
    };

    // star emoji validation
    let limit = cachedStar.get(message.id);
    if (!limit || isNaN(limit)) {
      let randLimit = Math.floor(Math.random() * (maxStar - minStar) + minStar);
      limit = randLimit;
      cachedStar.set(message.id, randLimit);
    };

    // increment if same user reacted
    if (reactions.find(val => message && (message.author.id == val.id))) ++limit;

    // check if the star reaction below threshold
    if (starReaction.count < limit) return;

    // check if the starboard has been posted before or nah
    const table = await starboardStorage.tableAsync("posted");
    if ((await table.has(message.id))) {
      return;
    };

    const userTag = `${client.utility.usernameHandle(message.author)}`;
    let embed = new RichEmbed().setColor(0xffac33).setTimestamp(new Date(message.timestamp))
      .setDescription(truncate(message.content, 1024))
      .setAuthor(`${userTag} (${message.author.id})`, message.author.avatarURL("png", 16))

    if (starterQuery) {
      const firstReactUserID = await firstReactedTable.get(message.id);
      const starterUser = client.users.get(firstReactUserID) || await client.rest.users.get(firstReactUserID).catch(() => { });
      if (starterUser) {
        embed.setFooter(`Si Pemulai: ${client.utility.usernameHandle(starterUser)}`)
      };
    };

    let file: File | undefined;

    let redirectButton: MessageActionRow[] = [{
      type: Constants.ComponentTypes.ACTION_ROW,
      components: [{
        type: Constants.ComponentTypes.BUTTON,
        style: Constants.ButtonStyles.LINK,
        label: "Dokumen Asli",
        url: message.jumpLink
      }]
    }];

    let embeddings: string[] = [];

    // bypass videos into a layered discord custom embed
    if (
      message.attachments.toArray()[0].contentType?.match(/^(video)/gi) ||
      message.embeds[0].type == "video" && message.embeds[0].url
    ) {
      const url = new URL("https://dce.cdn.13373333.one");

      url.searchParams.append("description", `${userTag} (${message.author.id})`);
      
      url.searchParams.append("title", truncate(message.content, 512));

      url.searchParams.append("embedColor", `#FFAC33`);

      const videoURL = message.attachments.toArray()?.[0]?.url || message.embeds?.[0]?.url;
      
      if (videoURL) {
        url.searchParams.append("videoURL", videoURL);

        return await client.rest.channels.createMessage(channelID, {
          components: redirectButton,
          content: `[Embed](${url.toString()})`
        });
      };
    };

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
        if (message.attachments.toArray()[0].contentType?.match(/^(image\/(jpe?g|gif|png|webp))/gi)) {
          embed.setImage(normalizeURL(message.attachments.toArray()[0].url));
        }

        else if (message.attachments.toArray()[0].contentType?.match(/^(video)/gi)) {
          embeddings.push(normalizeURL(message.attachments.toArray()[0].url));
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
          embed.setImage(normalizeURL(message.embeds[0].url));
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

    await client.rest.channels.createMessage(channelID, {
      embeds: embed.toJSON(true),
      components: redirectButton,
      files: file ? [file] : undefined
    });

    return await table.set(message.id, true);
  } catch (error) {
    return console.error(error);
  }
};