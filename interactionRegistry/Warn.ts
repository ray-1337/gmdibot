import Eris from "eris";
import Config from "../config";
import Util from "../handler/Util";
import db from "quick.db";
import ms from "ms";
const util = new Util();

export = async (client: Eris.Client, interaction: Eris.CommandInteraction) => {
  await interaction.defer();

  // some interaction bug
  if (!interaction || !interaction.data || !interaction.data.options) {
    return interaction.createMessage("Some content were missing. Please try again.");
  };

  // guard clause
  // if (interaction.member?.roles.includes(Config.role.staff))
  if (!interaction.member?.roles.some(x => Config.role.staff.includes(x))) {
    return interaction.createMessage("Missing permissions.");
  };
  
  let interactionBegins = (interaction.data.options![0] as Eris.InteractionDataOptionsSubCommand);
  let optionsBehind = (interactionBegins.options as Eris.InteractionDataOptions[]);
  let ErisTypes = Eris.Constants.ApplicationCommandOptionTypes;

  const embed = new Eris.RichEmbed().setTitle("Warning").setTimestamp();

  switch (interactionBegins.name) {
    case "add":
      if (!optionsBehind || optionsBehind.length < 3) {
        return interaction.createMessage("Some content were missing. Please try again.");
      };

      let member = (optionsBehind as Eris.InteractionDataOptionsUser[]).filter(x => x.name === "member" && x.type === ErisTypes.USER)[0];
      let level = (optionsBehind as Eris.InteractionDataOptionsInteger[]).filter(x => x.name === "level" && x.type === ErisTypes.INTEGER)[0];
      let reason = (optionsBehind as Eris.InteractionDataOptionsString[]).filter(x => x.name === "reason" && x.type === ErisTypes.STRING)[0];
      
      if (!reason || !reason.value) reason.value = "Not provided.";

      let memberValidation = client.guilds.get(Config.guildID)?.members.get(member.value);
      if (!memberValidation) {
        return interaction.createMessage("Member is not in guild, nor cached. Sorry.");
      };

      let warningLevelExplained;
      switch (level.value) {
        case 1: warningLevelExplained = "I"; break;
        case 2: warningLevelExplained = "II"; break;
        case 3: warningLevelExplained = "III"; break;
        default: warningLevelExplained = "Unknown."; break;
      };

      embed
      .setAuthor(`${memberValidation.username}#${memberValidation.discriminator}`, undefined, memberValidation.user.dynamicAvatarURL("png", 128))
      .setColor(0x121112)
      .addField("User ID", memberValidation.id, true)
      .addField("Moderator", `${interaction.member?.mention}`, true) // client.users.get(interaction.data.resolved?.users?.keys().next().value)?.mention
      .addField("Warning Level", warningLevelExplained, true)
      .addField("Reason", reason.value, true);

      let combinedWarningRoles = [Config.warning.role[1], Config.warning.role[2], Config.warning.role[3]];
      if (memberValidation.roles.some(x => x === Config.warning.role[level.value])) {
        return interaction.createMessage("Already executed. Try either select a different level or remove the warning role.");
      };

      // Warn III
      if (level.value === 3) {
        client.editGuildMember(Config.guildID, member.value, {roles: [Config.warning.role[level.value]]})
        .catch((error) => {
          console.error(error);
          return interaction.createMessage(`**Encountered error when assigning someone's role:** \n${error.code || 0} / ${error.message}`);
        });

        // reminder and stuff.
        let due = util.getRandomInt(Config.warning.session.III.minRange, Config.warning.session.III.maxRange);
        let conversionToDay = ms(due + "d");

        db.set(`warningLasted.${member.value}`, {
          since: Date.now(),
          due: conversionToDay,
          full: new Date(Date.now() + conversionToDay),
          memberID: member.value,
          previousRoleList: memberValidation.roles
        });

        // debugging
        // console.log(await db.get(`warningLasted.${member.value}`));
        
        embed
        .addField("Length", `${due} days`, true)
        .addField("Expiration", new Date(Date.now() + conversionToDay).toLocaleString('id-ID', {
          hour12: false,
          timeZone: "Asia/Jakarta",
          weekday: 'short',
          day: 'numeric',
          year: 'numeric',
          month: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        }) + " WIB");
      }

      // Warn I/II
      else if (level.value >= 1 || level.value <= 2) {
        // client.addGuildMemberRole(Config.guildID, member.value, Config.warning.role[level.value], reason.value)
        // .catch((error) => {
        //   console.error(error);
        //   return interaction.createMessage(`**Encountered error when assigning someone's role:** ${error.code || 0} / ${error.message}`);
        // });

        // why. god. (temporary solution, cus im stinky, havent take a shower for 69 days.)
        let memberValidateRolesNewArr: string[] = [];
        for (let role of memberValidation.roles) {
          if (combinedWarningRoles.includes(role)) continue;
          memberValidateRolesNewArr.push(role);
        };

        client.editGuildMember(Config.guildID, member.value, {
          roles: [...memberValidateRolesNewArr, Config.warning.role[level.value]]
        })
        .catch((error) => {
          console.error(error);
          return interaction.createMessage(`**Encountered error when assigning someone's role:** \n${error.code || 0} / ${error.message}`);
        });
      }

      else return;

      client.createMessage(Config.warning.channel.warning, {embeds: [embed]})
      .catch((error) => {
        console.error(error);
        return interaction.createMessage(`**Encountered error when posting a warning log:** \n${error.code || 0} / ${error.message}`);
      });

      return interaction.createMessage(`Set warning to ${memberValidation.mention} with level **${level.value}** succeeded.`);

    default:
      break;
  };

};