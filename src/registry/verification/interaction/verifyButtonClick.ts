import { type ComponentInteraction } from "oceanic.js";
import parseDuration from "parse-duration";

import { gmdiGuildID, memberRoleID, unverifiedRoleID, verificationLogChannelID } from "@/handler/Config";

import { cache, cooldown, cooldownTimeState } from "../config";
import type { RegisteredUserState } from "../typings";

import userCollection from "@/registry/verification/userCollection";
import questions from "@/registry/verification/questions";

export default async (interaction: ComponentInteraction) => {
  try {
    const client = interaction.client;
    const userDoc = userCollection.doc(interaction.user.id);

    // check if the user is currently has ongoing session
    if (cache.has(interaction.user.id)) {
      return interaction.reply({
        content: "Kamu saat ini memiliki sesi verifikasi yang sedang berjalan. Mohon diselesaikan terlebih dahulu.",
        flags: 64
      });
    };

    // check if the user is in cooldown state
    if (cooldown.has(interaction.user.id)) {
      const currentCooldown = cooldown.get(interaction.user.id);

      if (typeof currentCooldown === "number" && ((Date.now() - currentCooldown) <= cooldownTimeState)) {
        const timeRemaining = parseDuration(String(cooldownTimeState - (Date.now() - currentCooldown)), "second") || 0;

        return interaction.reply({
          content: `Harap tunggu, kamu masih memiliki cooldown selama **${Math.round(timeRemaining <= 0 ? 0 : timeRemaining)}** detik.`,
          flags: 64
        });
      };
    };

    const currentUser = await userDoc.get();
    const currentUserState = currentUser.data() as RegisteredUserState;

    switch (true) {
      // check if the user is blacklisted
      case (currentUserState?.blacklisted === true): {
        return interaction.reply({
          content: "Maaf, saat ini kamu berada di dalam daftar blacklist. Silakan hubungi staf GMDI untuk informasi lebih lanjut.",
          flags: 64
        });
      };

      // check if the user is already verified
      case (currentUserState?.verified === true): {
        if (process.env.npm_lifecycle_event !== "dev") {
          await interaction.reply({
            content: "Kamu sudah terverifikasi.", flags: 64
          });

          await Promise.all([
            client.rest.guilds.addMemberRole(gmdiGuildID, interaction.user.id, memberRoleID, "[GMDIBot] Already verified from store"),
            client.rest.guilds.removeMemberRole(gmdiGuildID, interaction.user.id, unverifiedRoleID, "[GMDIBot] Already verified from store")
          ]);

          return;
        };

        break;
      };

      default: break;
    };

    // check if the user has already submitted the form and it's not verified yet
    // the user can resubmit if the form is nowhere to be found around at least 10 messages
    const messages = await client.rest.channels.getMessages(verificationLogChannelID, {
      filter: (message) => message.author.id === client.user.id &&
        message.embeds.length >= 1 &&
        message.embeds?.[0].author?.name?.match(interaction.user.id) !== null &&
        message.embeds?.[0].title === "New User Verification",
      limit: 50
    });

    if (messages.length >= 1) {
      return interaction.reply({
        flags: 64,
        content: "Kamu sudah mengirimkan formulir verifikasi. Mohon untuk menunggu hasil verifikasi kurang lebih 24 jam ke depan."
      });
    };
  } catch (error) {
    console.error(error);
  };

  return await interaction.createModal({
    title: "GMDI Server Verification",
    customID: "verification_self_modal",
    components: questions
  });
};