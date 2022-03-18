import GMDIBot from "../../handler/Client";
import Config from "../../config/config";

export default async function(client: GMDIBot) {
  return;
  
  if (!client.database.get("warningLasted")) return;

  let warnings: [string, WarningLastedOptions][] = Object.entries(client.database.get("warningLasted"));

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
        client.database.set(`warningLasted.${userID}.due`, null),
        client.database.set(`warningLasted.${userID}.since`, null),
        client.database.set(`warningLasted.${userID}.full`, null)
      ]);

      if (shouldPost) {
        let user = `**${client.guilds.get(Config.guildID)?.members.get(userID)?.username}#${client.guilds.get(Config.guildID)?.members.get(userID)?.discriminator}** (${client.guilds.get(Config.guildID)?.members.get(userID)?.id})`
        client.createMessage(Config.warning.channel.warning, `A user warning has been successfully either decremented or removed from ${user} due to expiration timeout.`);
      };

      continue;
    };
  };
};