import { Client, AnyInteractionGateway, InteractionTypes, ComponentTypes, ButtonStyles, EmbedField, TextInputStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import ms from "ms";
import { stripIndents } from "common-tags";
import dayjs from "dayjs";
import parseDuration from "parse-duration";

// utility
const verificationCacheExpireTime: number = ms("5m");
import { randomNumber, usernameHandle } from "../handler/Util";
import { firstGeneralTextChannelID, gmdiGuildID, memberRoleID, staffRoleID, verificationChannelID, verificationLogChannelID } from "../handler/Config";

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
            try {
              if (cache.has(interaction.user.id)) {
                return interaction.createMessage({
                  content: "Kamu saat ini memiliki sesi verifikasi yang sedang berjalan. Mohon diselesaikan terlebih dahulu.",
                  flags: 64
                });
              };

              if (cooldown.has(interaction.user.id)) {
                const currentCooldown = cooldown.get(interaction.user.id);

                if (typeof currentCooldown === "number" && ((Date.now() - currentCooldown) <= cooldownTimeState)) {
                  const timeRemaining = parseDuration(String(cooldownTimeState - (Date.now() - currentCooldown)), "second") || 0;

                  return interaction.createMessage({
                    content: `Harap tunggu, kamu masih memiliki cooldown selama **${Math.round(timeRemaining <= 0 ? 0 : timeRemaining)}** detik.`,
                    flags: 64
                  });
                };
              };

              const currentUser = await userDoc.get();
              const currentUserState = currentUser.data() as RegisteredUserState;

              switch (true) {
                case (currentUserState?.blacklisted === true): {
                  return interaction.createMessage({
                    content: "Maaf, saat ini kamu berada di dalam daftar blacklist. Silakan hubungi staf GMDI untuk informasi lebih lanjut.",
                    flags: 64
                  });
                };

                case (currentUserState?.verified === true): {
                  if (process.env.npm_lifecycle_event !== "dev") {
                    await interaction.createMessage({
                      content: "Kamu sudah terverifikasi.", flags: 64
                    });

                    await client.rest.guilds.addMemberRole(gmdiGuildID, interaction.user.id, memberRoleID, "[GMDIBot] Already verified from store");

                    return;
                  };

                  break;
                };

                default: break;
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

          case "gd-verification-cancel":
          case "gd-verification-check": {
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

            const gdClient = await gdOriginClient.users.authorize({
              accountID: +process.env.GD_ACCOUNT_ID!,
              gjp: generateGJP(process.env.GD_SECRET_KEY as string),
              userName: process.env.GD_USERNAME!
            });

            if (!gdClient || typeof gdClient.id !== "number") {
              return interaction.createFollowup({content: "Terjadi kegagalan saat pengecekan isi DM dari sisi kami, coba lagi nanti.", flags: 64});
            };

            const messages = await gdClient.getMessages(25);
            
            const message = messages
            .filter(msg => (parseDuration(msg.sentAt.pretty) || 0) < verificationCacheExpireTime)
            .find(msg => msg.from.username === cachedUser.gdUsername && msg.subject.startsWith("Konfirmasi"));

            if (!message || typeof message.id !== "number") {
              return interaction.createFollowup({content: "Pesan tidak ditemukan. Pastikan pesan yang kamu kirim sudah benar dan tidak ketinggalan satu karakter pun.", flags: 64});
            };

            if (message.subject === `Konfirmasi ${String(cachedUser.code)}`) {
              const embed = new EmbedBuilder();

              embed
              .setTitle("New User Verification")
              .setTimestamp(new Date())
              .setAuthor(`@${interaction.user.username} (${interaction.user.id})`, interaction.user.avatarURL("webp", 128))
              .setColor(0xfcba03)
              .addField("Metadata", stripIndents(`
                - **GD Username:** ${cachedUser.gdUsername}
                - **Filled Forms Date/Time:** <t:${Math.round((dayjs(cachedUser.createdAt).tz("Asia/Jakarta").valueOf()) / 1000)}>
                - **User ID in Cache:** ${cachedUser.userID}
              `))
              .addBlankField();

              for (const [question, answer] of Object.entries(cachedUser.questions)) {
                embed.addField(question, answer);
              };

              await client.rest.channels.createMessage(verificationLogChannelID, {
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
                    }
                  ]
                }]
              });

              await interaction.createFollowup({
                flags: 64,
                content: "Formulir verifikasi kamu telah diterima, dan akan dicek oleh staf GMDI dalam 1x24 jam."
              });

              await userDoc.set({ userID: cachedUser.userID, gdUsername: cachedUser.gdUsername, lastUpdatedAt: Date.now() }, { merge: true });

              cache.delete(interaction.user.id);

              setTimeout(async () => {
                try {
                  // delete the message from the Discord DM
                  await interaction.message.delete();

                  // delete the message from GD account
                  await message.delete();
                } catch {};
              }, ms("5s"));

              return;
            } else {
              return interaction.createFollowup({
                flags: 64,
                content: "Pesan ditemukan, tapi isi pesan tidak sesuai."
              });
            };
          };

          case "deny-user-verification":
          case "accept-user-verification": {
            if (!interaction.member?.roles.some(roleID => roleID === staffRoleID)) {
              return interaction.createMessage({content: "You don't have permissions to do this.", flags: 64});
            };

            // if the staff rejects the application, they must provide a reason for transparency
            if (interaction.data.customID === "deny-user-verification") {
              return await interaction.createModal({
                title: "Reason to deny the verification",
                customID: `verification_staff_rejection-${interaction.message.channelID}-${interaction.message.id}`,
                components: [{
                  type: ComponentTypes.ACTION_ROW,
                  components: [{
                    customID: "reason",
                    label: "Reason",
                    style: TextInputStyles.SHORT,
                    type: ComponentTypes.TEXT_INPUT,
                    maxLength: 256,
                    required: true
                  }]
                }]
              });
            };

            await interaction.defer(64);

            const embed = interaction.message.embeds?.[0];
            if (!embed) {
              return interaction.createFollowup({content: "Invalid message embed.", flags: 64});
            };

            if (!embed?.author?.name?.length) {
              return interaction.createFollowup({content: "Unable to fetch user ID from previous embed.", flags: 64});
            };

            const userID = embed.author.name.match(/(\d{15,21})/gim);
            if (!userID?.[0]) {
              return interaction.createFollowup({content: "Unable to fetch user ID from previous embed.", flags: 64});
            };

            const fields: EmbedField[] = [];
            if (embed?.fields?.[0]) {
              fields.push(embed.fields[0]);
            };

            fields.push({
              name: "Accepted by",
              value: `@${interaction.user.username} (${interaction.user.id})`
            });

            await interaction.message.edit({
              components: [],
              embeds: [{
                ...embed,
                color: 0x34eb46,
                title: "New User Verification (Accepted)",
                timestamp: new Date().toISOString(),
                fields
              }]
            });

            await client.rest.guilds.addMemberRole(gmdiGuildID, userID[0], memberRoleID, "[GMDIBot] Finished verification");

            await interaction.createFollowup({content: "Accepted.", flags: 64})

            const userManualMention = `<@${userID[0]}>`;
            const user = await client.rest.users.get(userID[0]).catch(() => { return null });

            const welcomeEmbed = new EmbedBuilder()
            .setTimestamp(new Date()).setColor(0x24C86E)
            .setTitle(`Halo, ${user ? usernameHandle(user) : userManualMention} 👋`);

            await client.rest.channels.createMessage(firstGeneralTextChannelID, {
              content: user?.mention || userManualMention,
              embeds: welcomeEmbed.toJSON(true)
            });

            // optional: DM the user about the verification update
            // if the dm closed, we should ignore this
            try {
              const channel = await client.rest.channels.createDM(userID[0]);

              await channel.createMessage({content: "Verifikasi Anda telah diterima. Anda kini diperbolehkan untuk bergabung dengan server Discord kami."});
            } catch {};

            await userDoc.set({ userID: userID[0], verified: true, lastUpdatedAt: Date.now() }, { merge: true });

            return;
          };

          default: {
            return;
          };
        };
      };
    };

    if (interaction.type === InteractionTypes.MODAL_SUBMIT) {
      switch (interaction.data.customID.split(/\-/gim)[0]) {
        case "verification_self_modal": {
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

          const user = await gdOriginClient.users.getByUsername(gdUsername, true);
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

          const [message, _] = await Promise.all([
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
            } catch {};
          }, verificationCacheExpireTime);
          
          cooldown.set(content.userID, Date.now());

          return;
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

          const fields: EmbedField[] = [];
          if (embed?.fields?.[0]) {
            fields.push(embed.fields[0]);
          };

          fields.push({
            name: "Rejection Reason",
            value: reason
          });

          fields.push({
            name: "Rejected by",
            value: `@${interaction.user.username} (${interaction.user.id})`
          });

          await client.rest.channels.editMessage(channelID, messageID, {
            components: [],
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