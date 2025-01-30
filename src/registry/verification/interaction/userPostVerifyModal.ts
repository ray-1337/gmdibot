import { type ModalSubmitInteraction, ComponentTypes, ButtonStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { stripIndents } from "common-tags";

import { randomNumber } from "@/handler/Util";

import type { RegisteredUserState, UserVerificationChoice } from "../typings";
import { gdClient, cache, requirements, verificationCacheExpireTime, cooldown } from "../config";

import userCollection from "@/registry/verification/userCollection";
import questions from "@/registry/verification/questions";

export default async (interaction: ModalSubmitInteraction) => {
  const client = interaction.client;

  await interaction.defer(64);

  const gdUsername = interaction.data.components.getTextInput(questions[4].components[0].customID, true);
  if (!gdUsername?.length) {
    return interaction.createFollowup({ content: "Maaf, formulir GD username tidak terisi.", flags: 64 });
  };

  // check if the gd username is claimed
  const existedVerifiedUser = await userCollection.where("gdUsername", "==", gdUsername).where("verified", "==", true).get();
  if (existedVerifiedUser.docs.length > 0) {
    const usersState = existedVerifiedUser.docs.map(doc => doc.data() as RegisteredUserState);

    const currentUserState = usersState.find(user => user.userID === interaction.user.id);

    if (!currentUserState) {
      return interaction.createFollowup({ content: "Maaf, akun Geometry Dash tersebut sudah dimiliki oleh salah satu member di server Discord GMDI.", flags: 64 });
    };
  };

  const user = await gdClient.users.getByUsername(gdUsername, true);
  if (!user || typeof user.accountID !== "number" || typeof user.id !== "number") {
    return interaction.createFollowup({ content: `Maaf, akun Geometry Dash dengan username [\`${gdUsername}\`] tidak dapat ditemukan.`, flags: 64 });
  };

  // geometry dash account stats check
  if (
    (user.stats.stars < requirements.stars) &&
    (user.stats.demons < requirements.demons) &&
    (user.stats.coins.normal < requirements.coins.secret) &&
    (user.stats.coins.user < requirements.coins.user)
  ) {
    return interaction.createFollowup({
      flags: 64,
      content: "Maaf, akun Geometry Dash kamu saat ini belum memenuhi salah satu persyaratan kami yang tertera di kanal verifikasi. Coba lagi nanti."
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
    userID: interaction.user.id
  };

  const embed = new EmbedBuilder();

  embed
    .setColor(0x7289DA)
    .setTitle("Menunggu Verifikasi Lanjutan")
    .addField("Subject", `Konfirmasi ${content.code}`)
    .addField("Message", "[ketik apa saja]")
    .addField("❓ Kode sudah terkirim?", "Jika dirasa kode sudah terkirim ke akun kami \`GMDIBot\`, silakan kembali ke DM Discord ini dan tekan tombol **Cek Status**.")
    .setImage("https://gmdi.cdn.13373333.one/.GMDI_PRIVATE_ASSETS/example-001.png")
    .setDescription(stripIndents(`
              - Buka game **Geometry Dash** kamu.
              - Login dengan akun username yang sudah kamu masukkan sebelumnya.
              - Cari akun yang bernama \`GMDIBot\`.
              - Lalu kirim pesan ke akun tersebut PERSIS dibawah ini.
            `))

  const channel = await client.rest.channels.createDM(interaction.user.id);
  if (!channel?.id) {
    return interaction.createFollowup({
      flags: 64,
      content: "Maaf, kami tidak dapat mengirimkan pesan ke DM Discord kamu. Pastikan DM Discord kamu terbuka di server ini."
    });
  };

  cache.set(content.userID, content);

  const [message] = await Promise.all([
    channel.createMessage({
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
    }),

    interaction.createFollowup({
      content: "Silakan cek **DM Discord** kamu. Segera lakukan verifikasi lebih lanjut, kamu diberi waktu 5 menit untuk menyelesaikannya."
    })
  ]);

  setTimeout(async () => {
    try {
      cache.delete(content.userID);

      await message.delete();
    } catch { };
  }, verificationCacheExpireTime);

  cooldown.set(content.userID, Date.now());

  return;
};
