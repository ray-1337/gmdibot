import { scheduleJob } from "node-schedule";
import Eris from "eris";
import db from "quick.db";
import Config from "../config";
import GMDIBot from "../handler/Client";
import ms from "ms";

export default async function (client: GMDIBot) {
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

  scheduleJob('30 * * * *', function() {
    client.counter.userError.clear();
  });
};