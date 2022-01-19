import Eris from "eris";
import Config from "../config";

export = async (client: Eris.Client) => {
  if (!client) return;

  let memberChoosing = {
    type: Eris.Constants.ApplicationCommandOptionTypes.USER,
    name: "member",
    description: "Member yang ada di server",
    required: true,
  };

  let warningLevels = {
    type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
    name: "level",
    description: "Warning levels",
    required: true,
    choices: [
      { name: "Warn I", value: 1 },
      { name: "Warn II", value: 2 },
      { name: "Warn III", value: 3 }
    ]
  };

  let provideReason = {
    type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
    name: "reason",
    description: "Alasan kenapa membernya di-warn",
    required: true
  };

  let warnTimeout = {
    type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
    name: "timeout",
    description: "Lama warning bertahan. Contoh: \"1 jam 24 menit\" / Skip for no timeout.",
    required: false
  };

  let proofByURL = {
    type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
    name: "evidence",
    description: "Bukti. Harus berupa URL/Link website.",
    required: false
  };

  client.bulkEditGuildCommands(Config.guildID, [
    // warn add
    {
      name: "warn",
      type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
      description: "Warn the user (Exclusive)",
      defaultPermission: false,
      options: [
        {
          type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          name: "add",
          description: "Add warning role to user",
          options: [
            // member
            memberChoosing,
    
            // warning levels
            warningLevels,

            // reason
            provideReason,
    
            // how long will it stays?
            warnTimeout,

            // proof
            proofByURL
          ]
        }
      ]
    },

    // cant create a new line on slash cmd, fuck.

    {
      name: "point",
      type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
      description: "Check your point rate in order to get Active Members role.",
      defaultPermission: false
    }
    
    // {
    //   name: "eval",
    //   type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
    //   description: "Evaluate JavaScript code. (ray#1337 only)",
    //   defaultPermission: false,
    //   options: [
    //     {
    //       type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
    //       name: "code",
    //       description: "JavaScript code.",
    //       required: true
    //     }
    //   ]
    // }
  ]);
};