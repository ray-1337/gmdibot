import { type ModalSubmitInteraction, ComponentTypes, ButtonStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";

import dayjs from "dayjs";
import { randomBytes } from "node:crypto";
import { stripIndents } from "common-tags";
import ms from "ms";

import { randomNumber } from "@/handler/Util";

import { getGeometryDashUser } from "@/registry/gd/request";

import type { UserVerificationChoice } from "../typings";
import { cache, requirements, verificationCacheExpireTime, cooldown } from "../config";

import { submissionUserCollection } from "@/registry/verification/userCollection";
import questions from "@/registry/verification/questions";

export default async (interaction: ModalSubmitInteraction) => {
  try {
    const client = interaction.client;

    await interaction.defer(64);

    const gdUsername = interaction.data.components.getTextInput(questions[4].components[0].customID, true);
    if (!gdUsername?.length) {
      return interaction.createFollowup({ content: "Maaf, formulir GD username tidak terisi.", flags: 64 });
    };

    const latestVerificationUpdateSearch = await submissionUserCollection
      .select("userID", "createdAt")
      .where("userID", "==", interaction.user.id)
      .get();

    if (!latestVerificationUpdateSearch.empty) {
      for (const doc of latestVerificationUpdateSearch.docs) {
        const data = doc.data() as Pick<UserVerificationChoice, "userID" | "createdAt">;
        if (dayjs(Date.now()).diff(data.createdAt) <= ms("15m")) {
          return interaction.createFollowup({ content: "Maaf, kamu baru saja mengisi formulir verifikasi, silakan menunggu setidaknya 15 menit setelah mengisi formulir verifikasi.", flags: 64 });
        };
      };
    };

    // check if the gd username is claimed
    // const existedVerifiedUser = await userCollection.where("gdUsername", "==", gdUsername).get();
    // if (existedVerifiedUser.docs.length > 0) {
    //   return interaction.createFollowup({ content: "Maaf, akun Geometry Dash tersebut sudah dimiliki oleh salah satu member di server Discord GMDI.", flags: 64 });
    // };

    const user = await getGeometryDashUser(gdUsername);
    if (!user || isNaN(+user.accountID)) {
      return interaction.createFollowup({ content: `Maaf, akun Geometry Dash dengan username [\`${gdUsername}\`] tidak dapat ditemukan.`, flags: 64 });
    };

    // geometry dash account stats check
    if (
      (user.stars < requirements.stars) &&
      (user.demons < requirements.demons) &&
      (user.coins < requirements.coins.secret) &&
      (user.userCoins < requirements.coins.user)
    ) {
      return interaction.createFollowup({
        flags: 64,
        content: "Maaf, akun Geometry Dash kamu saat ini belum memenuhi salah satu persyaratan kami yang tertera di kanal verifikasi. Coba lagi nanti."
      });
    };

    const channel = await client.rest.channels.createDM(interaction.user.id);
    if (!channel?.id) {
      return interaction.createFollowup({
        flags: 64,
        content: "Maaf, kami tidak dapat mengirimkan pesan ke DM Discord kamu. Pastikan DM Discord kamu terbuka di server ini."
      });
    };

    const croppedQuestions = questions.slice(0, 4);

    const finalizedQuestions: Record<string, string> = {};

    for (let i = 0; i < croppedQuestions.length; i++) {
      const question = croppedQuestions[i].components[0];

      const answer = interaction.data.components.getTextInput(question.customID, true);

      finalizedQuestions[question.label] = answer;
    };

    const content: UserVerificationChoice = {
      gdUsername,
      code: randomNumber(1e7, 1e8),
      createdAt: Date.now(),
      questions: finalizedQuestions,
      userID: interaction.user.id,
      submissionReferenceId: randomBytes(6).toString("hex")
    };

    cache.set(content.userID, content);

    const embed = new EmbedBuilder();

    embed
      .setColor(0x7289DA)
      .setTitle("Menunggu Verifikasi Lanjutan")
      .addField("Subject", "Konfirmasi")
      .addField("Message", String(content.code))
      .addField("❓ Kode sudah terkirim?", "Jika dirasa kode sudah terkirim ke akun kami \`GMDIBot\`, silakan kembali ke DM Discord ini dan tekan tombol **Cek Status**.")
      .setImage("https://gmdi.cdn.13373333.one/.GMDI_PRIVATE_ASSETS/example-002.png")
      .setDescription(stripIndents(`
        - Buka **Geometry Dash** kamu.
        - Login dengan akun username yang sudah kamu masukkan sebelumnya.
        - Cari akun yang bernama \`GMDIBot\`.
        - Lalu kirim pesan ke akun tersebut dengan \`Subject\` **Konfirmasi** dan \`Message\` yang diisi dengan kode yang sesuai.
        - Karena peka akan huruf besar dan kecil (case sensitive), isi dan subjek pesan harus sesuai seperti diatas.
      `));

      try {
        const message = await channel.createMessage({
          embeds: embed.toJSON(true),
          components: [{
            type: ComponentTypes.ACTION_ROW,
            components: [
              {
                type: ComponentTypes.BUTTON,
                customID: "gd-verification-check",
                style: ButtonStyles.PRIMARY,
                emoji: { name: "✅" },
                label: "Cek status"
              },
              {
                type: ComponentTypes.BUTTON,
                customID: "gd-verification-cancel",
                style: ButtonStyles.DANGER,
                emoji: { name: "✖️" },
                label: "Batal"
              }
            ]
          }]
        });

        setTimeout(async () => {
          try {
            cache.delete(content.userID);

            await message.delete();
          } catch { };
        }, ms(`${verificationCacheExpireTime}m`));

        cooldown.set(content.userID, Date.now());

        return await interaction.createFollowup({
          content: `Silakan cek **DM Discord** kamu. Segera lakukan verifikasi lebih lanjut, kamu diberi waktu ${verificationCacheExpireTime} menit untuk menyelesaikannya.`
        })
      } catch (error) {
        console.error(error);
        return interaction.createFollowup({
          content: "Kami tidak bisa mengirimkan kode verifikasi ke DM Discord kamu."
        })
      };
  } catch (error) {
    console.error(error);
  };
};
