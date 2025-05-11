import { EmbedBuilder } from "@oceanicjs/builders";
import { type ComponentInteraction, ComponentTypes, ButtonStyles } from "oceanic.js";

import ms from "ms";
import dayjs from "dayjs";
import parseDuration from "parse-duration";
import { stripIndents } from "common-tags";

import { verificationLogChannelID, verificationChannelID } from "@/handler/Config";
import { getOfficialMessagesFromGD } from "@/handler/Util";

import { cache, verificationCacheExpireTime } from "../config";
import type { UserVerificationChoice } from "../typings";

import userCollection from "@/registry/verification/userCollection";

export default async (interaction: ComponentInteraction) => {
  try {
    const userDoc = userCollection.doc(interaction.user.id);

    await interaction.defer(64);

    if (!cache.has(interaction.user.id)) {
      return interaction.createFollowup({
        flags: 64,
        content: `Kamu tidak memiliki sesi verifikasi untuk saat ini. Kemungkinan besar waktu sesi verifikasi kamu sudah habis. Kamu bisa coba lagi untuk pergi ke kanal verifikasi kami (<#${verificationChannelID}>)`
      });
    };

    // cancel
    if (interaction.data.customID === "gd-verification-cancel") {
      cache.delete(interaction.user.id);

      interaction.message.delete();

      return await interaction.createFollowup({
        content: "Sesi verifikasi dibatalkan.", flags: 64
      });
    };

    const cachedUser = cache.get(interaction.user.id) as UserVerificationChoice;

    const messages = await getOfficialMessagesFromGD();
    if (!messages || !Array.isArray(messages) || messages.length <= 0) {
      return interaction.createFollowup({ content: "Terjadi kegagalan saat pengecekan isi DM dari sisi kami, coba lagi nanti.", flags: 64 });
    };

    const message = messages
      .filter(msg => (parseDuration(msg.date) || 0) < verificationCacheExpireTime)
      .find(msg => msg.author.toLowerCase() === cachedUser.gdUsername.toLowerCase() && msg.subject.startsWith("Konfirmasi"));

    if (!message || isNaN(+message.id)) {
      return interaction.createFollowup({ content: "Pesan tidak ditemukan. Pastikan pesan yang kamu kirim sudah benar dan tidak ketinggalan satu karakter pun.", flags: 64 });
    };

    if (message.subject === `Konfirmasi ${String(cachedUser.code)}`) {
      const embed = new EmbedBuilder();

      embed
        .setTitle("New User Verification")
        .setTimestamp(new Date())
        .setAuthor(`@${interaction.user.username} (${interaction.user.id})`, interaction.user.avatarURL("webp", 128))
        .setColor(0xfcba03)
        .addField("Metadata", stripIndents(`
          - **Geometry Dash Username:** ${cachedUser.gdUsername}
          - **Submission Time:** <t:${Math.round((dayjs(cachedUser.createdAt).tz("Asia/Jakarta").valueOf()) / 1000)}>
          - **Discord Account Creation Date:** <t:${Math.round(interaction.user.createdAt.getTime() / 1000)}>
        `));

      await interaction.client.rest.channels.createMessage(verificationLogChannelID, {
        embeds: embed.toJSON(true),
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [
            {
              type: ComponentTypes.BUTTON,
              customID: "accept-user-verification",
              style: ButtonStyles.SUCCESS,
              label: "Accept",
              emoji: { name: "✅" }
            },
            {
              type: ComponentTypes.BUTTON,
              customID: "deny-user-verification",
              style: ButtonStyles.DANGER,
              label: "Reject",
              emoji: { name: "✖️" }
            },
            {
              type: ComponentTypes.BUTTON,
              customID: "fetch-user-questions",
              style: ButtonStyles.SECONDARY,
              label: "Questionnaires",
              emoji: { name: "ℹ️" }
            }
          ]
        }]
      });

      await interaction.createFollowup({
        flags: 64,
        content: "Formulir verifikasi kamu telah diterima, dan akan dicek oleh staf GMDI dalam 1x24 jam."
      });

      await userDoc.set({
        userID: cachedUser.userID,
        gdUsername: cachedUser.gdUsername,
        lastUpdatedAt: Date.now(),
        questions: cachedUser.questions
      }, { merge: true });

      cache.delete(interaction.user.id);

      setTimeout(async () => {
        try {
          // delete the message from the Discord DM
          await interaction.message.delete();

          // delete the message from GD account
          // await message.delete();
        } catch { };
      }, ms("5s"));

      return;
    } else {
      return interaction.createFollowup({
        flags: 64,
        content: "Pesan ditemukan, tapi isi pesan tidak sesuai."
      });
    };
  } catch (error) {
    console.error(error);
  };
};