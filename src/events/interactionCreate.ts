import { type AnyInteractionGateway, InteractionTypes, ComponentTypes } from "oceanic.js";

export default async function(_, interaction: AnyInteractionGateway) {
  try {
    if (interaction.type === InteractionTypes.MESSAGE_COMPONENT) {
      // verification button
      if (interaction.data.componentType === ComponentTypes.BUTTON) {
        switch (interaction.data.customID) {
          case "verification_self_buttonclick": {
            const registry = await import("@/registry/verification/interaction/verifyButtonClick");
            return registry.default(interaction);
          };

          case "gd-verification-cancel":
          case "gd-verification-check": {
            const registry = await import("@/registry/verification/interaction/gdUserVerification");
            return registry.default(interaction);
          };

          case "fetch-user-questions":
          case "deny-user-verification":
          case "accept-user-verification": {
            const registry = await import("@/registry/verification/interaction/userPostVerifyModeratorCheck");
            return registry.default(interaction);
          };

          default: return;
        };
      };
    };

    if (interaction.type === InteractionTypes.MODAL_SUBMIT) {
      switch (interaction.data.customID.split(/\-/gim)[0]) {
        case "verification_self_modal": {
          const registry = await import("@/registry/verification/interaction/userPostVerifyModal");
          return registry.default(interaction);
        };

        case "verification_staff_rejection": {
          const registry = await import("@/registry/verification/interaction/userPostVerifyModeratorReject");
          return registry.default(interaction);
        };
      };
    };
  } catch (error) {
    return console.error(error);
  };
};