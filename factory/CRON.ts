import { scheduleJob } from "node-schedule";
import db from "quick.db";
import Config from "../config";
import GMDIBot from "../handler/Client";
import ms from "ms";

export default async function (client: GMDIBot) {
  // user chat
  scheduleJob({hour: 0, minute: 0, tz: "Asia/Jakarta"}, async function() {
    // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    let data: [string, UserChatInterface][] = Object.entries(db.get("userChatRate"));

    for (const [id, content] of data) {

      // push the sum today to sum week, in order to get converted into averages
      let currentOverload: boolean = false;
      if (!content.sum.week) {
        db.set(`userChatRate.${id}.sum.week`, [content.sum.today]);
      } else {
        if (content.sum.week.length >= 7) {
          db.push(`userChatRate.${id}.sum.week`, content.sum.week.slice(1).push(content.sum.today));
          currentOverload = true;
        } else {
          db.push(`userChatRate.${id}.sum.week`, content.sum.today);
        };
      };

      // reset
      db.set(`userChatRate.${id}.sum.today`, 0);

      // calculation
      let arrayOfAvg = content.sum.week as number[];
      currentOverload ? arrayOfAvg.slice(1).push(content.sum.today) : arrayOfAvg.push(content.sum.today);
      let sum = arrayOfAvg.reduce((acc, current) => acc + current);
      let res = Math.floor(sum / 7); // 7 is day of week
      db.set(`userChatRate.${id}.probability`, res);

      // pass the eligibility
      if (res >= Config.userChat.meta.threshold) {
        client.addGuildMemberRole(Config.guildID, id, Config.role.activeUser);
      };

      if (arrayOfAvg.length === 7 && res <= Config.userChat.meta.threshold) {
        if (!content.warning?.current) {
          let varyObj: UserChatInterface["warning"] = { since: new Date(), current: true };
          db.set(`userChatRate.${id}.warning`, varyObj);
        }
        
        else if (content.warning?.current && content.warning.since && Math.floor((new Date().getTime() - content.warning.since.getTime()) / 864e5) >= Config.userChat.meta.resetAfterInDay) {
          client.removeGuildMemberRole(Config.guildID, id, Config.role.activeUser);
        };
      }

      else {
        let varyObj: UserChatInterface["warning"] = { since: null, current: false };
        db.set(`userChatRate.${id}.warning`, varyObj);
      };

      continue;
    };
  });

  // warning timeout
  scheduleJob('* 1 * * *', async function() {
    if (!db.get("warningLasted")) return;

    let warnings: [string, WarningLastedOptions][] = Object.entries(db.get("warningLasted"));

    for (const [id, val] of warnings) {
      if (val.due) {
        let userID = id || val.memberID;
        let shouldPost: boolean = false;
        switch (val.level) {
          case 1: {
            client.removeGuildMemberRole(Config.guildID, userID, Config.warning.role[1]);
            
            shouldPost = true;
            break;
          };

          case 2: {
            let memberREST = client.guilds.get(Config.guildID)?.members.get(Config.guildID) || await client.getRESTGuildMember(Config.guildID, userID);
            if (memberREST) {
              // are you sure that we'll have to use the same amount of timeout again for Warn I?
              client.editGuildMember(Config.guildID, userID, {
                roles: [...memberREST.roles.filter((value) => {
                  let combinedWarningRoles = [Config.warning.role[1], Config.warning.role[2], Config.warning.role[3]];
                  if (!combinedWarningRoles.includes(value)) return true;
                }), Config.warning.role[1]]
              })
              .catch(err => console.error(err));
            };
            
            shouldPost = true;
            break;
          };

          case 3: {
            let memberREST = client.guilds.get(Config.guildID)?.members.get(Config.guildID) || await client.getRESTGuildMember(Config.guildID, userID);
            if (memberREST) {
              // are you sure that we'll have to use the same amount of timeout again for Warn I?
              client.editGuildMember(Config.guildID, userID, {
                roles: val.previousRoleList?.filter((value) => {
                  let combinedWarningRoles = [Config.warning.role[1], Config.warning.role[2], Config.warning.role[3]];
                  if (!combinedWarningRoles.includes(value)) return true;
                })
                .concat(Config.warning.role[2])
              })
              .catch(err => console.error(err));
            };
            
            shouldPost = true;
            break;
          };

          default:
            break;
        };

        // reset the timeout
        Promise.all([
          db.set(`warningLasted.${userID}.due`, null),
          db.set(`warningLasted.${userID}.since`, null),
          db.set(`warningLasted.${userID}.full`, null)
        ]);

        if (shouldPost) {
          client.createMessage(Config.warning.channel.warning, `A user warning has been successfully either decremented or removed from ${client.guilds.get(Config.guildID)?.members.get(userID)?.mention} due to expiration timeout.`);
        };

        continue;
      };
    };
  });

  // member welcome message replacement
  scheduleJob('* 12 * * *', async function() {
    if (!db.get("replaceWelcomeMessageUser")) return;

    let memberLeaveProposal: [string, FarewellMemberConclusion][] = Object.entries(db.get("replaceWelcomeMessageUser"));
    
    for (const [id, val] of memberLeaveProposal) {
      if (Math.floor(Date.now() - val.leavingSince) > ms("14d")) {
        try {
          db.delete(`replaceWelcomeMessageUser.${id || val.memberID}`);
        } catch (err) {
          console.error(err);
        };

        continue;
      };
    };
  });

  // counting error reset
  scheduleJob('30 * * * *', function() {
    client.counter.userError.clear();
  });
};