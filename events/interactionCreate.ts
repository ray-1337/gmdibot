import Eris from "eris";
import WarnCommute from "../interactionRegistry/Warn";

export = async (client: Eris.Client, interaction: Eris.Interaction) => {
  if (interaction instanceof Eris.CommandInteraction) {
    if (interaction.data.name === "warn" && interaction.data.type === Eris.Constants.ApplicationCommandTypes.CHAT_INPUT) {
      WarnCommute(client, interaction);
      return;
    };
  };

  // console.log(util.inspect((interaction as Eris.CommandInteraction).data.options![0], {depth: null}));
};