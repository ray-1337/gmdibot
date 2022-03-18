import Eris from "eris";
import Config from "../config/config";
import Util from "../handler/Util";
import ms from "ms";
import parseDur from "parse-duration";
import prettyMS from "pretty-ms";
import GMDIBot from "../handler/Client";

export = async (client: Eris.Client & GMDIBot, interaction: Eris.CommandInteraction) => {
  await interaction.defer();

  const util = new Util();

  // some interaction bug
  if (!interaction || !interaction.data || !interaction.data.options) {
    return interaction.createMessage("Some content were missing. Please try again.");
  };

  // guard clause
  // if (interaction.member?.roles.includes(Config.role.staff))
  if (!interaction.member?.roles.some(x => Config.role.staff.includes(x))) {
    return interaction.createMessage("Missing permissions.");
  };
  
  let interactionBegins = interaction.data.options[0] as Eris.InteractionDataOptionsSubCommand;
  let optionsBehind = interactionBegins.options as Eris.InteractionDataOptions[];
  let ErisTypes = Eris.Constants.ApplicationCommandOptionTypes;

  const embed = new Eris.RichEmbed().setTitle("Warning").setTimestamp();

  switch (interactionBegins.name) {
    case "add": {
      if (!optionsBehind || optionsBehind.length < 3) {
        return interaction.createMessage("Some content were missing. Please try again.");
      };

      // console.log(optionsBehind);

      let member = (optionsBehind as Eris.InteractionDataOptionsUser[]).filter(x => x.name === "member" && x.type === ErisTypes.USER)[0];

      let memberValidation = client.guilds.get(Config.guildID)?.members.get(member.value);
      if (!memberValidation) {
        return interaction.createMessage("Member is not in guild, nor cached. Sorry.");
      };

      if (memberValidation.bot === true || memberValidation.user.bot === true) {
        return interaction.createMessage("You can't warn a bot.");
      };

      let level = (optionsBehind as Eris.InteractionDataOptionsInteger[]).filter(x => x.name === "level" && x.type === ErisTypes.INTEGER)[0];
      let reason = (optionsBehind as Eris.InteractionDataOptionsString[]).filter(x => x.name === "reason" && x.type === ErisTypes.STRING)[0];
      
      // optional params, considerate
      let timeout = (optionsBehind as Eris.InteractionDataOptionsString[]).filter(x => x.name === "timeout" && x.type === ErisTypes.STRING)[0];
      let evidence = (optionsBehind as Eris.InteractionDataOptionsString[]).filter(x => x.name === "evidence" && x.type === ErisTypes.STRING)[0];

      if (!reason || !reason.value) reason.value = "Not provided.";

      let warningLevelExplained;
      switch (level.value) {
        case 1: warningLevelExplained = "I / 01"; break;
        case 2: warningLevelExplained = "II / 02"; break;
        case 3: warningLevelExplained = "III / 03"; break;
        default: warningLevelExplained = "Unknown."; break;
      };

      embed
      .setAuthor(`${memberValidation.username}#${memberValidation.discriminator}`, undefined, memberValidation.user.dynamicAvatarURL("png", 128))
      .setColor(0x464646)
      .setFooter(`ID: ${memberValidation.id}`)
      // .addField("User ID", memberValidation.id, true)
      .addField("Moderator", `${interaction.member?.mention}`, true) // client.users.get(interaction.data.resolved?.users?.keys().next().value)?.mention
      .addField("Warning Level", warningLevelExplained, true)
      .addField("Reason", reason.value, true);

      let fileContent: Eris.FileContent | undefined = undefined;
      if (evidence) {
        // no need regex shit lmao, i love it.
        try {
          new URL(evidence.value);
        } catch (error) {
          return interaction.createMessage("Failed to parse the URL.");
        };

        let request = await centra(evidence.value, "GET").timeout(10000).send();
        if (!request || (request.statusCode && request.statusCode >= 400)) {
          return interaction.createMessage("Failed to load evidence content.");
        };

        if (!request.headers["content-type"]?.match(/^(image\/\w+)/gi)) {
          return interaction.createMessage("Invalid evidence type.");
        };

        let ext = util.contentTypeDecide(request.headers["content-type"]);
        if (!ext) {
          return interaction.createMessage("Unable to find extension for the evidence.");
        };

        // link could be removed. use buffer instead.
        embed.setImage(`attachment://warningPart.userID_${memberValidation.id}.${ext}`);

        fileContent = {
          name: `warningPart.userID_${memberValidation.id}.${ext}`,
          file: Buffer.from(request.body)
        };
      };

      let combinedWarningRoles = [Config.warning.role[1], Config.warning.role[2], Config.warning.role[3]];
      if (memberValidation.roles.some(x => x === Config.warning.role[level.value])) {
        return interaction.createMessage("Already executed. Try either select a different level or remove the warning role.");
      };

      let formatTime: Intl.DateTimeFormatOptions = {
        hour12: false,
        timeZone: "Asia/Jakarta",
        weekday: 'short',
        day: 'numeric',
        year: 'numeric',
        month: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      };

      // Warn III
      if (level.value === 3) {
        if (timeout) {
          return interaction.createMessage(`This warning level cannot be presented with timeout. Warn III timeout must be randomized by itself from 30 to 90 days.`);
        };

        try {
          await client.editGuildMember(Config.guildID, member.value, {roles: [Config.warning.role[level.value]]});
        } catch (error) {
          if (!(error instanceof Eris.DiscordRESTError)) return;
          console.error(error);
          interaction.createMessage(`**Encountered error when assigning someone's role:** \n${error.code || 0} / ${error.message}`);
          return;
        };

        // reminder and stuff.
        let due = util.getRandomInt(Config.warning.session.III.minRange, Config.warning.session.III.maxRange);
        let conversionToDay = ms(due + "d");

        client.database.set(`warningLasted.${member.value}`, {
          since: Date.now(),
          due: conversionToDay,
          full: new Date(Date.now() + conversionToDay).getTime(),
          memberID: member.value,
          previousRoleList: memberValidation.roles,
          level: level.value
        });

        // debugging
        // console.log(await db.get(`warningLasted.${member.value}`));
        
        embed
        .addField("Length", `${due} days`, true)
        .addField("Expiration", new Date(Date.now() + conversionToDay).toLocaleString('id-ID', formatTime) + " WIB");

        client.createMessage(Config.warning.channel.logging, `${memberValidation.mention} (${memberValidation.id}) [${due} days]`)
        .catch(() => {});
      }

      // Warn I/II
      else if (level.value >= 1 || level.value <= 2) {
        // client.addGuildMemberRole(Config.guildID, member.value, Config.warning.role[level.value], reason.value)
        // .catch((error) => {
        //   console.error(error);
        //   return interaction.createMessage(`**Encountered error when assigning someone's role:** ${error.code || 0} / ${error.message}`);
        // });
        if (timeout) {
          // custom
          parseDur["nanosekon"] = parseDur["ns"];
          parseDur["mikrosekon"] = parseDur["μs"];
          parseDur["milisekon"] = parseDur["ms"];
          parseDur["sekon"] = parseDur["s"];
          parseDur["menit"] = parseDur["m"];
          parseDur["jam"] = parseDur["h"];
          parseDur["hari"] = parseDur["d"];
          parseDur["minggu"] = parseDur["wk"];
          parseDur["bulan"] = parseDur["months"];
          parseDur["tahun"] = parseDur["yr"];

          let parsedTime = parseDur(timeout.value);
          if (!parsedTime) {
            return interaction.createMessage("Unable to parse timeout format.");
          };

          if (parsedTime < ms("1h") || parsedTime > ms("365d")) {
            return interaction.createMessage("The timeout parameter is out of limit. Should be more than an hour, less than a year or equivalent.");
          };
  
          client.database.set(`warningLasted.${member.value}`, {
            since: Date.now(),
            due: parsedTime,
            full: new Date(Date.now() + parsedTime).getTime(),
            memberID: member.value,
            previousRoleList: memberValidation.roles,
            level: level.value
          });

          embed
          .addField("Length", prettyMS(parsedTime, {verbose: !0}), true)
          .addField("Expiration", new Date(Date.now() + parsedTime).toLocaleString('id-ID', formatTime) + " WIB");
        };

        // why. god. (temporary solution, cus im stinky, havent take a shower for 69 days.)
        let memberValidateRolesNewArr: string[] = [];
        for (let role of memberValidation.roles) {
          if (combinedWarningRoles.includes(role)) continue;
          memberValidateRolesNewArr.push(role);
        };

        try {
          await client.editGuildMember(Config.guildID, member.value, {
            roles: [...memberValidateRolesNewArr, Config.warning.role[level.value]]
          });
        } catch (error) {
          if (!(error instanceof Eris.DiscordRESTError)) return;
          console.error(error);
          return interaction.createMessage(`**Encountered error when assigning someone's role:** \n${error.code || 0} / ${error.message}`);
        };
      }

      else {
        return interaction.createMessage(`Unable to parse warning levels.`);
      };

      try {
        await client.createMessage(Config.warning.channel.warning, {embeds: [embed]}, fileContent)
        .then((x) => {
          if (timeout && level.value < 3) client.database.set(`warningLasted.${member.value}.warningLogID`, x.id);
        });
      } catch (error) {
        if (!(error instanceof Eris.DiscordRESTError)) return console.error(error);
        console.error(error);
        return interaction.createMessage(`**Encountered error when posting a warning log:** \n${error.code || 0} / ${error.message}`);
      };

      return interaction.createMessage(`Successfully set warning to **${memberValidation.username}#${memberValidation.discriminator}** with level **${warningLevelExplained}**.`);
    };

    default:
      break;
  };

};