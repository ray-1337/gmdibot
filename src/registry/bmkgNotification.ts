import { Client, ComponentTypes, ButtonStyles, ChannelTypes, type File } from "oceanic.js";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import ms from "ms";
import dayjs from "dayjs";
import { xml2json } from "xml-js";

import { colorizedMagnitudeEmbed, customInaTime, isInIndonesia, mercalliIntensityScale, isDevMode } from "../handler/Util";

const timezone = "Asia/Jakarta";
const cached = new Set<string>();
const maxWindowTime: number = ms("15m");

let intervalStarted: NodeJS.Timeout | null = null;
let lastModified: string | null = null;

const endpoint = "https://bmkg-content-inatews.storage.googleapis.com/live30event.xml";

export default async (client: Client) => {
  if (intervalStarted !== null) {
    clearInterval(intervalStarted);
    intervalStarted = null;
  };

  intervalStarted = setInterval(async () => {
    try {
      const checkHeader = await fetch(endpoint, { method: "HEAD" });
      if (!checkHeader.ok) {
        throw await checkHeader.text();
      };

      const lastModifiedHeader = checkHeader.headers.get("last-modified");
      if (typeof lastModifiedHeader === "string" && (typeof lastModified === "string" && lastModifiedHeader === lastModified)) {
        return;
      };

      const earthquakeReq = await fetch(endpoint);
      if (!earthquakeReq.ok) {
        throw await earthquakeReq.text();
      };

      const rawXmlData = await earthquakeReq.text();
      if (!rawXmlData || typeof rawXmlData !== "string") {
        return;
      };

      lastModified = lastModifiedHeader;

      const convertedData = JSON.parse(xml2json(rawXmlData, {
        compact: true,
        ignoreDoctype: true,
        ignoreDeclaration: true
      })) as { Infogempa: { gempa: Array<Record<string, Record<"_text", string>>> } };

      const filteredData = convertedData.Infogempa.gempa.map(item => 
        Object.fromEntries(
          Object.entries(item).map(([k, v]) => [k, v._text || v])
        )
      );

      const data = filteredData?.[0] as PartialEarthquakeDataProps["Infogempa"]["gempa"][number];
      if (!data) return;

      const earthquakeID = data.eventid;

      // prevent replay
      if (typeof earthquakeID !== "string" || cached.has(earthquakeID)) {
        return;
      };

      const currentTime = dayjs().tz(timezone);
      const earthquakeTime = dayjs(customInaTime(data.waktu)).tz(timezone);

      // check if its already late
      if (currentTime.diff(earthquakeTime) > maxWindowTime) {
        return;
      };
      
      // at least >= {specified}
      let limitMagnitudeToPost = 3;
      const magnitude = Number(data.mag);
      if (isNaN(magnitude) || (magnitude < limitMagnitudeToPost)) {
        cached.add(earthquakeID);
        
        if (isDevMode) {
          console.log(`GMDI & BMKG (realtime alternative): Posted with earthquake ID [${earthquakeID}] but the magnitude is lower than ${limitMagnitudeToPost} [${magnitude}]`);
        };

        return;
      };

      // host
      const generalChannel = "1062203494691520522";

      const { lintang, bujur } = data;
      if (isNaN(+lintang) || isNaN(+bujur) || !isInIndonesia(+lintang, +bujur)) {
        return;
      };

      const coordinates = [lintang, bujur].join(",");

      const earthquakeColor = colorizedMagnitudeEmbed(magnitude);
      const embed = new RichEmbed()
        .setColor(earthquakeColor)
        .setURL(`https://www.google.com/maps/search/?api=1&query=${coordinates}`)
        .setAuthor("Indonesia Tsunami Early Warning System (sub-alternative of BMKG)", "https://indonesiaexpat.id/wp-content/uploads/2022/02/WRS.png", "https://inatews.bmkg.go.id/")
        .setFooter("Provided by BMKG");

      let displayName = data.area;

      // reverse geocoding
      const geocodingReq = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lintang}&lon=${bujur}&zoom=12&format=jsonv2`, {
        headers: {
          "Accept-Language": "id-ID"
        }
      });

      if (geocodingReq.ok) {
        const json = await geocodingReq.json() as Record<"display_name", string> & { address: { country_code: string; } };
        if (json?.address?.country_code !== "id") {
          return;
        };

        if (typeof json.display_name === "string") {
          displayName = json.display_name;
        };
      };
      
      embed
        .setTitle(displayName)
        .addField("Lintang / Bujur", `${data.lintang} / ${data.bujur}`)
        .addField("Skala", `${magnitude} / ${mercalliIntensityScale(magnitude)}`, true)
        .addField("Kedalaman", data.dalam + " km", true)
        .addField("Waktu Terdeteksi", `<t:${earthquakeTime.unix()}>`, true);

      const reversedCoordinates = [lintang, bujur].reverse().join(",");

      // mapbox
      const mapboxFetch = await fetch(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/pin-l+${earthquakeColor.toString(16)}(${reversedCoordinates})/${reversedCoordinates},6.95,0/1280x800?access_token=${process.env.MAPBOX_TOKEN}`
      );

      let geographyImageContent: File | null = null;

      if (mapboxFetch.status >= 400) {
        console.error(await mapboxFetch.text());
        console.warn(`GMDI & BMKG (realtime alternative): Failed to fetch mapbox`);
      } else {
        embed.setImage(`attachment://gmdi_attitude_eq_${earthquakeID}.png`);
        geographyImageContent = {
          name: `gmdi_attitude_eq_${earthquakeID}.png`,
          contents: Buffer.from(await mapboxFetch.arrayBuffer())
        };
      };

      const postedBMKGMessage = await client.rest.channels.createMessage(generalChannel, {
        embeds: embed.toJSON(true),
        components: [{
          type: ComponentTypes.ACTION_ROW,
          components: [{
            type: ComponentTypes.BUTTON,
            style: ButtonStyles.LINK,
            emoji: {id: null, name: "🔗"},
            label: "Info lebih lanjut",
            url: "https://www.bmkg.go.id/gempabumi/gempabumi-dirasakan"
          }]
        }],

        ...((geographyImageContent !== null) && ({
          files: [geographyImageContent]
        }))
      });

      if (!isDevMode && postedBMKGMessage?.channel && postedBMKGMessage.channel.type === ChannelTypes.GUILD_ANNOUNCEMENT) {
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
  Infogempa: {
    gempa: Array<Record<"eventid" | "status" | "waktu" | "lintang" | "bujur" | "dalam" | "mag" | "fokal" | "area", string>>;
  };
};