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
          await interaction.defer(64);

          const [channelID, messageID] = interaction.data.customID.split(/\-/gim).slice(1);
          if (!channelID.match(/(\d{16,21})/gim) || !messageID.match(/(\d{16,21})/gim)) {
            return interaction.createFollowup({ content: "Invalid secondary ID from interaction.", flags: 64 });
          };

          const reason = interaction.data.components.getTextInput("reason", true);
          if (!reason?.length) {
            return interaction.createFollowup({ content: "Invalid reason.", flags: 64 });
          };

          const logMessage = await client.rest.channels.getMessage(channelID, messageID);
          const embed = logMessage?.embeds?.[0] || null;
          if (!logMessage || !embed || !embed?.author) {
            return interaction.createFollowup({ content: "Unable to fetch previous log message.", flags: 64 });
          };

          const userID = embed?.author?.name.match(/(\d{15,21})/gim);
          if (!userID?.[0]) {
            return interaction.createFollowup({content: "Unable to fetch user ID from previous embed.", flags: 64});
          };

          let fields: EmbedField[] = [...embed?.fields || []];

          fields = fields.concat([
            {
              name: "Rejection Reason",
              value: reason
            },
            {
              name: "Rejected by",
              value: `@${interaction.user.username} (${interaction.user.id})`
            }
          ]);

          await client.rest.channels.editMessage(channelID, messageID, {
            components: [{
              type: ComponentTypes.ACTION_ROW,
              components: [
                logMessage.components[0].components[logMessage.components[0].components.length - 1]
              ]
            }],

            embeds: [{
              ...embed,
              color: 0xeb4634,
              title: "New User Verification (Rejected)",
              timestamp: new Date().toISOString(),
              fields
            }]
          });

          try {
            const channel = await client.rest.channels.createDM(userID[0]);

            await channel.createMessage({
              content: stripIndents(`
                Mohon maaf, verifikasi Anda untuk bergabung ke server Discord kami ditolak dengan alasan berikut.
                > *${reason}*
              `)
            });
          } catch {};

          await userDoc.set({ userID: userID[0], lastUpdatedAt: Date.now() }, { merge: true });
          
          await interaction.createFollowup({content: "Rejected.", flags: 64});

          return;
        };
      };
    };
  } catch (error) {
    return console.error(error);
  };
};