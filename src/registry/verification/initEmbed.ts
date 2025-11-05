import { Client, ComponentTypes, ButtonStyles } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { channel } from "../../handler/Config";

export default async function(client: Client) {
  try {
    const messages = await client.rest.channels.getMessages(channel.verification, {
      limit: 10, filter(message) {
        return message.author.id === client.user.id
      },
    });

    if (messages?.length <= 0) {
      const embed = new EmbedBuilder();

      embed
      .setTitle("Verifikasi")
      .setDescription("Untuk mendapatkan akses penuh ke server Discord ini, diharapkan untuk menekan tombol **Verifikasi** di bawah ini.")
      .setColor(0x7289DA);

      await client.rest.channels.createMessage(channel.verification, {
        embeds: embed.toJSON(true),
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [
            {
              type: ComponentTypes.BUTTON,
              style: ButtonStyles.PRIMARY,
              customID: "verification_self_buttonclick",
              label: "Verifikasi",
              emoji: { name: "✅" }
            },
            {
              type: ComponentTypes.BUTTON,
              style: ButtonStyles.LINK,
              label: "Ban Appeal Form",
              emoji: { name: "🔨" },
              url: "https://forms.gle/cApJTBsWey6yM3rj9"
            }
          ]
        }]
      })
    };
  } catch (error) {
    console.error(error);
  };

  return;
};