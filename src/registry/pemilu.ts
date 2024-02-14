import { GMDIExtension } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { fetch } from "undici";

const channelID: string = "1207271115546951700";
let messageID: string | null = null;
const endpoint: string = "https://news.files.bbci.co.uk/include/vjeastasia/1473-indonesia-election-2024-live-data/data-transformed.json";
const promotionalImage: string = "https://diskominfo.sukoharjokab.go.id/storage/Aw0VeYJEVDAtH7XlZxfvoDoRFT0nj2lXolkn87dO.jpeg";

export default async function(client: GMDIExtension) {
  try {
    const req = await fetch(endpoint, {
      method: "GET"
    });

    const data = await req.json() as PemiluPartialData;
    if (!data?.pilpresData) return;

    const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle("Hasil hitung cepat sementara Pilpres 2024")
    .setDescription("**Format:** Lembaga Survei Indonesia / Populi Center / Charta Politika")
    .setFooter("Data diambil langsung dari ketiga handler diatas. Di update setiap 60 detik.")
    .setTimestamp(new Date())
    .setImage(promotionalImage)

    .addField("01. Anies Baswedan/Muhaimin Iskandar", `${data.pilpresData.lsi.anies}% / ${data.pilpresData.populi.anies}% / ${data.pilpresData.charta.anies}%`)
    .addField("02. Prabowo Subianto/Gibran Rakabuming", `${data.pilpresData.lsi.prabowo}% / ${data.pilpresData.populi.prabowo}% / ${data.pilpresData.charta.prabowo}%`)
    .addField("03. Ganjar Pranowo/Mahfud MD", `${data.pilpresData.lsi.ganjar}% / ${data.pilpresData.populi.ganjar}% / ${data.pilpresData.charta.ganjar}%`)
    
    .addBlankField()
    
    .addField("Progress (penghitungan voting sejauh ini)", `${data.pilpresData.lsi.progress}% / ${data.pilpresData.populi.progress}% / ${data.pilpresData.charta.progress}%`, true)
    .addField("Turnout", `${data.pilpresData.lsi.turnout}% / ${data.pilpresData.populi.turnout}% / ${data.pilpresData.charta.turnout}%`, true)

    if (!messageID) {
      const message = await client.rest.channels.getMessages(channelID, {
        filter: (message) => message.author.bot && message.author.id === client.user.id
      });

      if (!message?.length) {
        const message = await client.rest.channels.createMessage(channelID, {
          embeds: embed.toJSON(true)
        });

        messageID = message.id;

        return;
      };

      messageID = message[0].id;
    };

    await client.rest.channels.editMessage(channelID, messageID, {
      embeds: embed.toJSON(true)
    });
  } catch (error) {
    console.error(error);
  };
};

type CurrentCaleg = "anies" | "prabowo" | "ganjar";

type CalegWithPartialProgress = Record<CurrentCaleg | "progress" | "turnout", string>

interface PemiluPartialData {
  pilpresData: Record<"charta" | "populi" | "lsi", CalegWithPartialProgress>;
}