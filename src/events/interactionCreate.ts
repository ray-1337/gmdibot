import { Client, AnyInteractionGateway, InteractionTypes, ComponentTypes, ButtonStyles, EmbedField, TextInputStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import ms from "ms";
import { stripIndents } from "common-tags";
import dayjs from "dayjs";
import parseDuration from "parse-duration";

// utility
const verificationCacheExpireTime: number = ms("5m");
import { randomNumber, usernameHandle } from "../handler/Util";
import { firstGeneralTextChannelID, botOwnerIDs, unverifiedRoleID, gmdiGuildID, memberRoleID, staffRoleID, verificationChannelID, verificationLogChannelID } from "../handler/Config";

// typings
import type { UserVerificationChoice, RegisteredUserState } from "../registry/verification/typings";

// user temporary cache
const cache = new Map<string, UserVerificationChoice>();

// cooldown
const cooldownTimeState = ms("3m");
const cooldown = new Map<string, number>();

// collection
import userCollection from "../registry/verification/userCollection";

// questions
import questions from "../registry/verification/questions";

// gd client
import { client as gdOriginClient } from "../registry/verification/gdClient";

// config
import { requirements } from "../registry/verification/config";

// generate gjp
import generateGJP from "../registry/generateGJP";

export default async (client: Client, interaction: AnyInteractionGateway) => {
  try {
    const userDoc = userCollection.doc(interaction.user.id);

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