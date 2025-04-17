import { Client, ComponentTypes, ButtonStyles, ChannelTypes } from "oceanic.js";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import ms from "ms";
import dayjs from "dayjs";
import { colorizedMagnitudeEmbed, mercalliIntensityScale, isDevMode } from "../handler/Util";

const timezone = "Asia/Jakarta";
const cached = new Set<string>();
const maxWindowTime: number = ms("15m");

let intervalStarted: NodeJS.Timeout | null = null;
let lastModified: string | null = null;

export default async (client: Client) => {
  if (intervalStarted !== null) {
    return;
  };

  intervalStarted = setInterval(async () => {
    try {
      const endpoint = "https://bmkg-content-inatews.storage.googleapis.com/datagempa.json";
      const checkHeader = await fetch(endpoint, { method: "HEAD" });
      if (!checkHeader.ok) {
        throw await checkHeader.text();
      };

      const lastModifiedHeader = checkHeader.headers.get("last-modified");
      if (typeof lastModifiedHeader === "string") {
        if (typeof lastModified === "string" && lastModifiedHeader === lastModified) {
          return;
        };

        lastModified = lastModifiedHeader;
      };

      const earthquakeReq = await fetch(endpoint, { method: "GET" });
      if (!earthquakeReq.ok) {
        throw await earthquakeReq.text();
      };

      const data = await earthquakeReq.json() as PartialEarthquakeDataProps;
      if (!data || typeof data !== "object" || typeof data?.info !== "object") {
        return;
      };

      const currentTime = dayjs().tz(timezone);
      const earthquakeTime = dayjs(data.sent.slice(0, data.sent.length - 3))

      // check if its already late
      if (currentTime.diff(earthquakeTime) > maxWindowTime) {
        return;
      };

      const earthquakeID = data.info.eventid;
      
      // prevent replay
      if (typeof earthquakeID !== "string" || isNaN(+earthquakeID) || cached.has(earthquakeID)) {
        return;
      };
      
      // at least >= {specified}
      let limitMagnitudeToPost = 3;
      const magnitude = Number(data.info.magnitude);
      if (isNaN(magnitude) || (magnitude < limitMagnitudeToPost)) {
        cached.add(earthquakeID);
        
        if (isDevMode) {
          console.log(`GMDI & BMKG (realtime alternative): Posted with earthquake ID [${earthquakeID}] but the magnitude is lower than ${limitMagnitudeToPost} [${magnitude}]`);
        };

        return;
      };

      // host
      const generalChannel = "1062203494691520522";

      const earthquakeColor = colorizedMagnitudeEmbed(magnitude);
      const embed = new RichEmbed()
        .setColor(earthquakeColor)
        .setAuthor("Indonesia Tsunami Early Warning System (sub-alternative of BMKG)", "https://indonesiaexpat.id/wp-content/uploads/2022/02/WRS.png", "https://inatews.bmkg.go.id/")
        .setFooter("Provided by BMKG", "https://inatews.bmkg.go.id/favicon.ico")
        .setTimestamp(new Date())
        .setImage(`https://bmkg-content-inatews.storage.googleapis.com/${earthquakeID}.mmi.jpg`)
        .setTitle(data.info.area);
      
      embed
        .addField("Lintang / Bujur", `${data.info.latitude} / ${data.info.longitude}`)
        .addField("Skala", `${magnitude} / ${mercalliIntensityScale(magnitude)}`, true)
        .addField("Kedalaman", data.info.depth.toLowerCase(), true)
        .addField("Waktu Terdeteksi", `<t:${Math.round(earthquakeTime.valueOf() / 1000)}>`, true);

      const postedBMKGMessage = await client.rest.channels.createMessage(generalChannel, {
        // content: contentTemplate,
        embeds: embed.toJSON(true),
        // files,
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [{
            type: ComponentTypes.BUTTON,
            style: ButtonStyles.LINK,
            emoji: {id: null, name: "📑"},
            label: "More information",
            url: "https://www.bmkg.go.id/gempabumi/gempabumi-dirasakan"
          }]
        }]
      });

      if (postedBMKGMessage?.channel && postedBMKGMessage.channel.type === ChannelTypes.GUILD_ANNOUNCEMENT) {
        try {
          await postedBMKGMessage.crosspost();
        } catch {}
      };

      cached.add(earthquakeID);

      if (isDevMode) {
        console.log(`GMDI & BMKG (realtime alternative): Posted with ID_${magnitude}`);
      };

      return;
    } catch (error) {
      return console.error(error);
    };
  }, ms("1m"));

  return console.log(`GMDI & BMKG (realtime alternative): Ready.`);
};

interface PartialEarthquakeDataProps {
  sent: string;
  info: Record<"date" | "time" | "latitude" | "longitude" | "depth" | "eventid" | "area" | "magnitude", string>;
};