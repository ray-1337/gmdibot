import Eris from "eris";
import Config from "../config";

export = async (client: Eris.Client) => {
  if (!client) return;

  let memberChoosing = {
    type: Eris.Constants.ApplicationCommandOptionTypes.USER,
    name: "member",
    description: "Existing server member",
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
    description: "Warning reason",
    required: true
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
          description: "Add warn to user",
          options: [
            // member
            memberChoosing,
    
            // warning levels
            warningLevels,

            // reason
            provideReason
    
            // how long will it stays?
            /** @soon Manual removal policy. */
            // {
            //   type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
            //   name: "timeout",
            //   description: "How long will it stays? Skip this (ENTER) for no timeout.",
            //   required: false
            // },
          ]
        }
      ]
    }
  ]);
};