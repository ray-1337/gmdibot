import Eris from "eris";
import * as Util from "../handler/Util";
import GMDIBot from "../handler/Client";
import Config from "../config/config";
import ms from "ms";
import Cache from "node-cache";

const standardOldMessageTime = ms("5m");

let endeavour: Array<{messageID: string, mentioned: string[]}> = [];

// export function cache(channelID: string, userID: string) {
//   const expireTime = Math.round(standardOldMessageTime / 1000);
//   const cache = new Cache({checkperiod: 60, deleteOnExpire: true, stdTTL: expireTime});
//   const cacheKey = `proceedWarningGhostPing_${channelID}_${userID}`;

//   const get = () => (cache.get(cacheKey) as boolean | null) || false;
//   const set = () => cache.set(cacheKey, true, expireTime);
//   const del = () => get() ? cache.del(cacheKey) : null;

//   return {get, set, del};
// };

export default async (client: Eris.Client & GMDIBot, msg: Eris.Message<Eris.GuildTextableChannel> | DeletedMessage, oldMessage?: Eris.OldMessage) => {
  try {
    // check message
    let message = await Util.transformMessage(client, msg);
    if (!message || message.author.bot || message.guildID !== Config.guildID) return;

    // ignore category
    let ignoredCategory = ["759298776656510998", "360450207386828810", "627808236015190017", "954290819886612480", "535466115459973120"];
    if (message.channel.parentID && ignoredCategory.includes(message.channel.parentID)) {
      return;
    };

    // ignore if its not existed
    // if (!cache(message.channel.id, message.author.id).get()) {
    //   return;
    // };

    // ignore old message more than an hour
    if (Math.floor(Date.now() - message.timestamp) > standardOldMessageTime) {
      return;
    };

    const embed = new Eris.RichEmbed()
      .setTimestamp()
      .setAuthor(
        `Ghost Ping dari: ${message.author.username}#${message.author.discriminator}`,
        undefined,
        message.author.dynamicAvatarURL("png", 32)
      );

    let ctx: Eris.MessageContent = {
      embeds: [embed],

      messageReference: {
        messageID: message.id,
        failIfNotExists: false
      },

      allowedMentions: {
        users: true,
        repliedUser: true,
        everyone: false,
        roles: false
      }
    };

    // from messageUpdate (edited, stuff)
    if (oldMessage) {
      // no ping but edited ({notag} -> {tag}) which will triggers checkMentionsDifference
      if (!oldMessage.editedTimestamp && (!oldMessage.roleMentions.length && !oldMessage.mentions.length)) {
        return immediateIgnore(client, message.id);
      };

      embed.setColor(0xF29C3F);
      if (oldMessage.content) embed.setDescription(oldMessage.content);

      // temporary checking
      // @ts-expect-error
      let oldUsersMention = mentionsFiltering((oldMessage.mentions as Eris.User[]), message.author.id).map(val => val.id);
      let newUsersMention = mentionsFiltering(message.mentions, message.author.id).map(val => val.id);
      
      let deletedUserMentions = checkDeletedMentions(oldUsersMention, newUsersMention);
      let deletedRoleMentions = checkDeletedMentions(oldMessage.roleMentions, message.roleMentions);

      if (deletedUserMentions.length + deletedRoleMentions.length == 0) {
        return;

      } else {
        console.log(endeavour);
        let currentEndeavour = endeavour.find(val => val.messageID == message!.id);
        let previousMentioned = currentEndeavour?.mentioned || oldUsersMention;
        let ghostMention = previousMentioned.filter(mention => deletedUserMentions.includes(mention));
        let currentMentioned = previousMentioned.filter(mention => ghostMention.includes(mention));
        if (currentMentioned.length) {
          if (!currentEndeavour) {
            endeavour.push({messageID: message.id, mentioned: currentMentioned});
          } else {
            currentEndeavour.mentioned = currentMentioned;
          }
        };

        if (ghostMention.length == 0) {
          return;
        }

        let ignored = await immediateIgnore(client, message.id);
        if (ignored) {
          return;
        }
        
        if (ghostMention.length) {
          ctx.content = ghostMention.map(userID => `<@!${userID}>`).join(" ");
        };
      }

    }

    // from messageDelete(pure)
    else {
      embed.setColor(0xF53131);

      if (message.content) {
        embed.setDescription(message.content);
      };

      const check = await checkMentions(client, message);

      if (check?.hasMentions) {
        let ignored = await immediateIgnore(client, message.id);
        if (ignored) {
          return;
        } else {
          ctx.content = check.variant.join(" ");
        };
      } else {
        return;
      };
    };

    await client.createMessage(message.channel.id, ctx);
    
    return;
  } catch (error) {
    return console.error(error);
  };
};

function mentionsFiltering(users: Array<Eris.User>, userID: string) {
  return users.filter(val => val.id !== userID && !val.bot);
};

function checkDeletedMentions(oldMentions: string[], newMentions: string[]) {
  return oldMentions.filter(x => !newMentions.includes(x));
};

export async function checkMentions(client: Eris.Client, message: Eris.Message<Eris.GuildTextableChannel>) {
  let hasMentions: boolean = false;
  let variant: string[] = [];

  // check user mentions
  const UserMention = mentionsFiltering(message.mentions, message.author.id); // depressing filter func
  if (UserMention.length >= 1) {
    variant = UserMention.map(val => val.mention);
    hasMentions = true;
  };

  // check role mentions
  const RoleMention = message.roleMentions;
  if (RoleMention.length >= 1 && !hasMentions) {
    let rolesMentionable = (message.channel?.guild?.roles || await client.getRESTGuildRoles(message.guildID)).filter(val => val.mentionable);
    let check = rolesMentionable.some(val => RoleMention.includes(val.id));

    hasMentions = check;
  };

  return { hasMentions, variant };
};

export async function immediateIgnore(client: Eris.Client & GMDIBot, messageID: string) {
  const ignoreCheckingKey = "ignoreChecking";
  const check = await client.database.get(ignoreCheckingKey) as string[] | null;
  if (!check?.find(val => val == messageID)) {
    await client.database.push(ignoreCheckingKey, messageID);
    return false;
  } else {
    return true;
  };
};

// export async function removalForth(client: Eris.Client, message: Eris.Message<Eris.GuildTextableChannel>) {
//   let current = await checkMentions(client, message);
//   if (current.hasMentions) {
//     cache(message.channel.id, message.author.id).set();
//   };
// };