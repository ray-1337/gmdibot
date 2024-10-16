import {Constants, Client, Message, AnyTextableGuildChannel, PartialEmoji, Member, Uncached, User, File, MessageActionRow} from "oceanic.js";
import ms from "ms";
import normalizeURL from "normalize-url";
import { transformMessage, truncate, randomNumber, usernameHandle } from "../handler/Util";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { firestore } from "../handler/Firebase";
import { starboardChannelID as channelID } from "../handler/Config";

const [minStar, maxStar] = [6, 9];
const starEmoji = "⭐";

export default async (client: Client, msg: Message<AnyTextableGuildChannel>, _: PartialEmoji, reactor: Uncached | User | Member) => {
  try {
    // must be presented in guild
    if (!msg?.channel?.guildID || !msg?.channel?.id) return;

    if (reactor instanceof Member) {
      if (reactor.bot) return;
    };

    // check message
    let message = await transformMessage(client, msg);
    if (!message?.channel) return;

    // message older than Feb 28, 2024 will be ignored
    let breakingChangesDate = new Date("Feb 28 2024").getTime();
    if (message.createdAt.getTime() < breakingChangesDate) return;

    // star in the same channel
    if (message.channel.id == channelID) return;

    // check if the star reaction is in the message
    const starReaction = message.reactions.find(({emoji}) => emoji.name === starEmoji);
    if (!starReaction || starReaction.me) return;

    if (Date.now() - message.createdAt.getTime() >= ms("90d")) return;

    let reactions = await client.rest.channels.getReactions(message.channel.id, message.id, starEmoji);

    // starboard starter
    const starboardCollection = firestore.collection("starboard");
    const starboardMessageDoc = starboardCollection.doc(message.id);
    const currentStarboardMessage = await starboardMessageDoc.get();

    const starThreshold = randomNumber(minStar, maxStar);

    if (reactions.length >= 1) {
      if (!currentStarboardMessage.exists) {
        await starboardMessageDoc.set({
          "reactorID": reactions[0].id,
          "posted": false,
          "starCount": starThreshold
        }, { merge: true });
      };
    } else if (reactions.length <= 0) {
      if (currentStarboardMessage.exists) {
        await starboardMessageDoc.delete();
      };
    };

    // check if the starboard has been posted before or nah
    const starboardMessageData = currentStarboardMessage.data() as Partial<Record<"reactorID", string> & { posted?: boolean; starCount?: number; }>;
    if (starboardMessageData?.posted) {
      return;
    };

    // star emoji validation
    let limit = starboardMessageData?.starCount;
    if (typeof limit !== "number") {
      await starboardMessageDoc.set({"starCount": starThreshold}, { merge: true });

      limit = starThreshold;
    };

    // increment if same user reacted
    if (reactions.find(val => message && (message.author.id == val.id))) ++limit;

    // check if the star reaction below threshold
    if (starReaction.count < limit) return;

    const userTag = `${usernameHandle(message.author)}`;
    let embed = new RichEmbed().setColor(0xffac33).setTimestamp(new Date(message.timestamp))
      .setDescription(truncate(message.content, 1024))
      .setAuthor(`${userTag} (${message.author.id})`, message.author.avatarURL("png", 16));

    if (starboardMessageData?.reactorID?.length) {
      const starterUser = client.users.get(starboardMessageData.reactorID) || await client.rest.users.get(starboardMessageData.reactorID).catch(() => { });
      if (starterUser) {
        embed.setFooter(`Si Pemulai: ${usernameHandle(starterUser)}`)
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

    // listing
    const attachments = message.attachments.toArray();

    // bypass videos into a layered discord custom embed
    if (
      (attachments.length >= 1 && attachments[0].contentType?.match(/^(video)/gi)) ||
      (message.embeds.length >= 1 && (message.embeds[0].type === "video" || message.embeds[0].type === "gifv"))
    ) {
      const url = new URL("https://dce.cdn.13373333.one");
      url.searchParams.append("description", `${userTag} (${message.author.id})`);
      url.searchParams.append("title", truncate(message.content, 512));
      url.searchParams.append("embedColor", `#FFAC33`);

      const videoURL = attachments?.[0]?.url || message.embeds?.[0]?.video?.url || message.embeds?.[0]?.url;
      
      if (typeof videoURL === "string") {
        url.searchParams.append("videoURL", videoURL);

        await client.rest.channels.createMessage(channelID, {
          components: redirectButton,
          content: `[Embed](${url.toString()})`
        });

        await starboardMessageDoc.update({posted: true});

        return;
      };
    };

    if (message.attachments.size || message.embeds.length) {
      let ext = {
        "image/gif": ".gif",
        "image/jpeg": ".jpeg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        // "video/mp4": ".mp4",
        // "video/webm": ".webm"
      };

      // attachments
      if (message.attachments.size == 1) {
        if (attachments[0].contentType?.match(/^(image\/(jpe?g|gif|png|webp))/gi)) {
          embed.setImage(normalizeURL(attachments[0].url));
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

    await starboardMessageDoc.update({posted: true});

    return;
  } catch (error) {
    return console.error(error);
  }
};