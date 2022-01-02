import Eris from "eris";
import WarnCommute from "../interactionRegistry/Warn";
import EvalCommute from "../interactionRegistry/Eval";

export = async (client: Eris.Client, interaction: Eris.Interaction) => {
  if (interaction instanceof Eris.CommandInteraction) {
    if (interaction.data.type === Eris.Constants.ApplicationCommandTypes.CHAT_INPUT) {
      switch (interaction.data.name) {
        case "warn":
          return WarnCommute(client, interaction);

        case "eval":
          return EvalCommute(client, interaction);

        default:
          return interaction.createMessage("Unknown command execution.");
      };
    };
  };

  // console.log(util.inspect((interaction as Eris.CommandInteraction).data.options![0], {depth: null}));
};