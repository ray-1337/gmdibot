import { type ComponentInteraction, type EmbedField, ComponentTypes, TextInputStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";

import { staffRoleID, gmdiGuildID, memberRoleID, unverifiedRoleID, botOwnerIDs, firstGeneralTextChannelID } from "@/handler/Config";
import { usernameHandle } from "@/handler/Util";

import type { RegisteredUserState } from "../typings";

import userCollection from "@/registry/verification/userCollection";

export default async (interaction: ComponentInteraction) => {
  const client = interaction.client;
  const userDoc = userCollection.doc(interaction.user.id);

  if (!interaction.member?.roles.some(roleID => roleID === staffRoleID)) {
    return interaction.createMessage({ content: "You don't have permissions to do this.", flags: 64 });
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
    return interaction.createFollowup({ content: "Invalid message embed.", flags: 64 });
  };

  if (!embed?.author?.name?.length) {
    return interaction.createFollowup({ content: "Unable to fetch user ID from previous embed.", flags: 64 });
  };

  const userID = embed.author.name.match(/(\d{15,21})/gim);
  if (!userID?.[0]) {
    return interaction.createFollowup({ content: "Unable to fetch user ID from previous embed.", flags: 64 });
  };

  // fetch user questionnaires
  if (interaction.data.customID === "fetch-user-questions") {
    const secondUserDoc = await userCollection.doc(userID[0]).get();
    const userData = secondUserDoc.data() as RegisteredUserState;

    if (!userData?.questions) {
      return interaction.createFollowup({
        content: "No questionnaires available. Only available on a new registered user after Dec 15, 2024.", flags: 64
      });
    };

    let userProfile = client.users.get(userID[0]);
    if (!userProfile) {
      userProfile = await client.rest.users.get(userID[0]);

      if (!userProfile) {
        return interaction.createFollowup({
          content: "Unable to fetch Discord user information.",
          flags: 64
        });
      };
    };

    const questionFields: EmbedField[] = [];

    for (const [question, answer] of Object.entries(userData.questions)) {
      questionFields.push({
        name: question,
        value: answer
      });
    };

    return await interaction.createFollowup({
      embeds: [{
        title: "Questionnaires",
        fields: questionFields,
        timestamp: new Date(userData.lastUpdatedAt).toISOString(),
        color: 0x7289DA,
        author: {
          name: `@${userProfile.username} (${userProfile.id})`,
          iconURL: userProfile.avatarURL("webp", 64)
        }
      }]
    });
  };

  let fields: EmbedField[] = [...embed?.fields || []];

  fields.push({
    name: "Accepted by",
    value: `@${interaction.user.username} (${interaction.user.id})`
  });

  await interaction.message.edit({
    components: [{
      type: ComponentTypes.ACTION_ROW,
      components: [
        interaction.message.components[0].components[interaction.message.components[0].components.length - 1]
      ]
    }],

    embeds: [{
      ...embed,
      color: 0x34eb46,
      title: "New User Verification (Accepted)",
      timestamp: new Date().toISOString(),
      fields
    }]
  });

  await Promise.all([
    client.rest.guilds.addMemberRole(gmdiGuildID, userID[0], memberRoleID, "[GMDIBot] Finished verification"),
    client.rest.guilds.removeMemberRole(gmdiGuildID, userID[0], unverifiedRoleID, "[GMDIBot] Finished verification")
  ]);

  await interaction.createFollowup({ content: "Accepted.", flags: 64 })

  const userManualMention = `<@${userID[0]}>`;
  const user = await client.rest.users.get(userID[0]).catch(() => { return null });

  if (!botOwnerIDs.includes(userID[0]) && process.env.npm_lifecycle_event !== "dev") {
    const welcomeEmbed = new EmbedBuilder()
      .setTimestamp(new Date()).setColor(0x24C86E)
      .setTitle(`Halo, ${user ? usernameHandle(user) : userManualMention} 👋`);

    await client.rest.channels.createMessage(firstGeneralTextChannelID, {
      content: user?.mention || userManualMention,
      embeds: welcomeEmbed.toJSON(true)
    });
  };

  // optional: DM the user about the verification update
  // if the dm closed, we should ignore this
  try {
    const channel = await client.rest.channels.createDM(userID[0]);

    await channel.createMessage({ content: "Verifikasi Anda telah diterima. Anda kini diperbolehkan untuk bergabung dengan server Discord kami." });
  } catch { };

  await userDoc.set({ userID: userID[0], verified: true, lastUpdatedAt: Date.now() }, { merge: true });

  return;
};