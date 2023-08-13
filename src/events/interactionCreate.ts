import { GMDIExtension, AnyInteractionGateway, ComponentInteraction, Constants } from "oceanic.js";
import { goofyButtonID } from "../registry/membershipScreenings";

export default async (_: GMDIExtension, interaction: AnyInteractionGateway) => {
  // gmdi_wwtiw
  if (interaction instanceof ComponentInteraction) {
    if (interaction.data.componentType === Constants.ComponentTypes.BUTTON) {
      if (interaction.data.customID === goofyButtonID) {
        return interaction.createMessage({
          flags: 64,
          embeds: [{
            image: {
              url: "https://cdn.13373333.one/QwOAtTrX.png"
            }
          }]
        })
      };
    };
  };
};