import { GMDIExtension } from "oceanic.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { fetch } from "undici";

const channelID: string = "1207271115546951700";
let messageID: string = "1207276695967760467";

const endpoint: string = "https://sirekap-obj-data.kpu.go.id/pemilu/hhcw/ppwp.json";
const promotionalImage: string = "https://diskominfo.sukoharjokab.go.id/storage/Aw0VeYJEVDAtH7XlZxfvoDoRFT0nj2lXolkn87dO.jpeg";

export default async function(client: GMDIExtension) {
  try {
    const req = await fetch(endpoint, { method: "GET" });

    const data = await req.json() as OfficialPemiluPartialData;
    if (!data?.chart) return;

    const allVoters = data.chart["100025"] + data.chart["100026"] + data.chart["100027"];

    const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle("Hasil hitung suara Pemilu Presiden & Wakil Presiden RI 2024 (Resmi)")
    .setFooter("Data diambil langsung dari website kpu.go.id. Di update setiap 60 detik.")
    .setTimestamp(new Date())
    .setImage(promotionalImage)
    .setURL("https://pemilu2024.kpu.go.id/")

    .addField("01. Anies Baswedan/Muhaimin Iskandar", `${data.chart[100025].toLocaleString()} voted (**${((data.chart["100025"] / allVoters) * 100).toFixed(2)}%**)`)
    .addField("02. Prabowo Subianto/Gibran Rakabuming", `${data.chart[100026].toLocaleString()} voted (**${((data.chart["100026"] / allVoters) * 100).toFixed(2)}%**)`)
    .addField("03. Ganjar Pranowo/Mahfud MD", `${data.chart[100027].toLocaleString()} voted (**${((data.chart["100027"] / allVoters) * 100).toFixed(2)}%**)`)
    
    .addBlankField()
    
    .addField("Progress (penghitungan voting sejauh ini)",`${data.progres.progres.toLocaleString()} TPS terhitung dari total ${data.progres.total.toLocaleString()} (**${((data.progres.progres / data.progres.total) * 100).toFixed(2)}%**)`, true)
    .addField("Voters", allVoters.toLocaleString(), true)

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

type OfficialPemiluPartialDataKey = 100025 | 100026 | 100027 | "persen";

interface OfficialPemiluPartialData {
  chart: Record<OfficialPemiluPartialDataKey, number>;
  progres: Record<"progres" | "total", number>;
}