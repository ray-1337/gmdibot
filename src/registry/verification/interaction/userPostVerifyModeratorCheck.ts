import { type ComponentInteraction, type EmbedField, ComponentTypes, TextInputStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";

import { staffRoleIDs, gmdiGuildID, roles, botOwnerIDs, channel } from "@/handler/Config";
import { usernameHandle, extractDiscordID } from "@/handler/Util";

import type { RegisteredUserState, UserVerificationChoice } from "../typings";

import { registeredUserCollection, submissionUserCollection } from "@/registry/verification/userCollection";

export default async (interaction: ComponentInteraction) => {
  try {
    const client = interaction.client;

    if (!botOwnerIDs.includes(interaction.user.id) && !interaction.member?.roles.some(roleID => staffRoleIDs.includes(roleID))) {
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
    if (!embed?.author?.name) {
      return interaction.createFollowup({ content: "Invalid message embed.", flags: 64 });
    };

    const userID = extractDiscordID(embed.author.name);
    if (!userID) {
      return interaction.createFollowup({ content: "Unable to fetch user ID from previous embed.", flags: 64 });
    };

    const userDoc = registeredUserCollection.doc(userID);

    // fetch user questionnaires
    if (interaction.data.customID === "fetch-user-questions") {
      // NEW: get based on submission reference id
      const metadata = embed?.fields?.[0]?.value;
      const submissionReferenceIds = metadata?.match(/Q_(([a-f0-9]){12})/im);

      let questions: RegisteredUserState["questions"];

      const submissionReferenceId = submissionReferenceIds?.[1];
      if (typeof submissionReferenceId === "string") {

        const submissionDoc = await submissionUserCollection.doc(submissionReferenceId).get();
        if (!submissionDoc.exists) {
          return interaction.createFollowup({ content: "No questionnaires available.", flags: 64 });
        };

        const submissionData = submissionDoc.data() as Omit<UserVerificationChoice, "code">;
        if (!submissionData?.questions || Object.keys(submissionData.questions).length <= 0) {
          return interaction.createFollowup({ content: "No questionnaires available.", flags: 64 });
        };

        questions = submissionData.questions;
      };

      const userData = (await userDoc.get()).data() as RegisteredUserState;

      if (!questions && typeof userData?.questions !== "undefined") {
        questions = userData.questions;
      };

      if (!questions) {
        return interaction.createFollowup({
          content: "No questionnaires available for this user.",
          flags: 64
        });
      };

      let userProfile = client.users.get(userID);
      if (!userProfile) {
        userProfile = await client.rest.users.get(userID);

        if (!userProfile) {
          return interaction.createFollowup({
            content: "Unable to fetch Discord user information.",
            flags: 64
          });
        };
      };

      const questionFields: EmbedField[] = [];

      for (const [question, answer] of Object.entries(questions)) {
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
          // @ts-expect-error
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
      client.rest.guilds.addMemberRole(gmdiGuildID, userID, roles.member, "[GMDIBot] Finished verification"),
      client.rest.guilds.removeMemberRole(gmdiGuildID, userID, roles.unverified, "[GMDIBot] Finished verification")
    ]);

    await interaction.createFollowup({ content: "Accepted.", flags: 64 })

    const userManualMention = `<@${userID}>`;
    const user = await client.rest.users.get(userID).catch(() => { return null });

    if (!botOwnerIDs.includes(userID) && process.env.npm_lifecycle_event !== "dev") {
      const welcomeEmbed = new EmbedBuilder()
        .setTimestamp(new Date()).setColor(0x24C86E)
        .setTitle(`Halo, ${user ? usernameHandle(user) : userManualMention} 👋`);

      await client.rest.channels.createMessage(channel.general, {
        content: user?.mention || userManualMention,
        embeds: welcomeEmbed.toJSON(true)
      });
    };

    // optional: DM the user about the verification update
    // if the dm closed, we should ignore this
    try {
      const channel = await client.rest.channels.createDM(userID);

      await channel.createMessage({ content: "Verifikasi Anda telah kami terima. Selamat datang di Discord server Geometry Dash Indonesia!" });
    } catch { };

    await userDoc.set({ verified: true, lastUpdatedAt: Date.now() }, { merge: true });

    return;
  } catch (error) {
    console.error(error);
  };
};