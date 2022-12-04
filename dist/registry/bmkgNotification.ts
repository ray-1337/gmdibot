import { GMDIExtension } from "oceanic.js";
import { Client as TwitterClient } from "twitter-api-sdk";
import redis from "../Cache";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { request } from "undici";
import ms from "ms";

import dayjs from "dayjs";
import dayjsTZ from "dayjs/plugin/timezone";
import dayjsUTC from "dayjs/plugin/utc";
dayjs.extend(dayjsTZ);
dayjs.extend(dayjsUTC);

const { tweets } = new TwitterClient(process.env.TWITTER_BEARER!);

export const subKey = "gmdi_bmkg_twitter_warning_subscription";

let subscribed = false, connected = false;

const sub = redis.duplicate();

export default async (client: GMDIExtension) => {
  if (subscribed) return;

  try {
    if (!connected) {
      await sub.connect().then(() => {
        console.log("GMDI & BMKG: Duplicated Subredis ready.");
        connected = true;
      });
    };
    
    await sub.subscribe(subKey, async (tweetID) => {
      console.log(`GMDI & BMKG: tweeted on ${tweetID}`);

      // no content presented
      if (!tweetID?.length) return;

      try {
        const tweet = await tweets.findTweetById(tweetID, {
          expansions: ["attachments.media_keys"],
          "media.fields": ["preview_image_url"],
          "tweet.fields": ["attachments"]
        });

        if (!tweet?.data || tweet?.errors) {
          return console.error(tweet?.errors || tweet);
        };

        // #gempa only
        if (!tweet?.data?.text?.match(/\#(Gempa)/gm) && !tweet?.data?.text?.match(/\#(BMKG)/gm)) return;

        // fetch data gempa from bmkg for accuracy
        const BMKGendpoint = "https://data.bmkg.go.id/DataMKG/TEWS/";

        // bmkg serves latest data with magnitudo over 5.0
        const BMKGData = await request(BMKGendpoint + "autogempa.json", {
          method: "GET",
          headers: { "content-type": "application/json" }
        });

        if (BMKGData.statusCode >= 400) {
          throw await BMKGData.body.text();
        };

        const parsedBMKGData = await BMKGData.body.json() as fullBMKGJsonResult;
        const shortenBMKGData = parsedBMKGData?.Infogempa?.gempa;
        if (!shortenBMKGData) return console.log("GMDI & BMKG (Exclusive): Data retrieved, but results nothing.");

        // old data
        const earthquakeID = new Date(shortenBMKGData.DateTime).getTime();
        if (earthquakeID <= new Date("2022-12-03T14:43:40.463Z").getTime()) return;

        const cachedEQKey = "earthquakeAcute";
        const cachedEarthQuake = await redis.get(cachedEQKey); // prevent replay
        if (cachedEarthQuake && cachedEarthQuake === String(earthquakeID)) return;

        // post over 5.0 only
        if (Number(shortenBMKGData.Magnitude) < 5.0) return;

        // host
        const generalChannel = "190826809896468480";
        const contentTemplate = "Stay safe, kawan-kawan. ⚠";
        const bmkgLogo = "https://cdn.bmkg.go.id/Web/Logo-BMKG-new-242x300.png";
        const disclaimer = "Dalam beberapa menit pertama setelah gempa, parameter gempa dapat berubah dan tidak akurat, kecuali dianalisis ulang oleh seismologist.";

        const embed = new RichEmbed()
          .setColor(0xf50925)
          .setAuthor("Badan Meteorologi, Klimatologi, dan Geofisika (Official Platform)", bmkgLogo, "https://warning.bmkg.go.id")
          .setImage(BMKGendpoint + shortenBMKGData.Shakemap)
          .setFooter("Powered by data.bmkg.go.id", "https://www.bmkg.go.id/asset/img/gempabumi/magnitude.png")
          .setTimestamp(new Date())
          .setTitle("Earthquake Warning")
          .setDescription("An earthquake magnitude scale with >= 5.0 will be alerted.")

        // embed fields
        embed
          .addField("Location (Latitude / Longitude)", `${shortenBMKGData.Lintang} / ${shortenBMKGData.Bujur}`)
          .addField("Magnitude / Mercalli Intensity Scale", `${shortenBMKGData.Magnitude} / ${mercalliIntensityScale(Number(shortenBMKGData.Magnitude))}`, true)
          .addField("Depth", shortenBMKGData.Kedalaman, true)
          .addField("Affected Regions", shortenBMKGData.Dirasakan)
          .addField("Time Detected", dayjs(shortenBMKGData.DateTime).tz("Asia/Jakarta").utc(true).toString())
          .addField("Disclaimer", disclaimer);

        await client.rest.channels.createMessage(generalChannel, {
          content: contentTemplate,
          embeds: embed.toJSON(true)
        });

        await redis.set(cachedEQKey, earthquakeID);
        await redis.expire(cachedEQKey, Math.round(ms("7d") / 1000));

        return;
      } catch (error) {
        return console.error(error);
      };
    });

    subscribed = true;
  } catch (error) {
    subscribed = false;

    return console.error(error);
  };

  return console.log("GMDI & BMKG (Exclusive): Ready.");
};

export function mercalliIntensityScale(magnitude: number) {
  // research
  // https://en.wikipedia.org/wiki/Modified_Mercalli_intensity_scale
  // https://www.bmkg.go.id/gempabumi/skala-mmi.bmkg

  // 1.0–3.0	I
  // 3.0–3.9	II–III
  // 4.0–4.9	IV–V
  // 5.0–5.9	VI–VII
  // 6.0–6.9	VII–VIII
  // 7.0 and higher	VIII or higher

  switch (true) {
    case magnitude <= 2.9: return "I";
    case magnitude >= 3.0 && magnitude <= 3.4: return "II";
    case magnitude >= 3.5 && magnitude <= 3.9: return "III";

    case magnitude >= 4.0 && magnitude <= 4.4: return "IV";
    case magnitude >= 4.5 && magnitude <= 4.9: return "V";

    case magnitude >= 5.0 && magnitude <= 5.4: return "VI";
    case magnitude >= 5.5 && magnitude <= 6.4: return "VII";
    case magnitude >= 6.5 && magnitude <= 6.9: return "VI";

    case magnitude >= 7.0: return "VIII";
  };
};

interface fullBMKGJsonResult {
  Infogempa: {
    gempa: {
      Tanggal: string;
      Jam: string;
      DateTime: string;
      Coordinates: string;
      Lintang: string;
      Bujur: string;
      Magnitude: string;
      Kedalaman: string;
      Wilayah: string;
      Potensi: string;
      Dirasakan: string;
      Shakemap: string;
    };
  };
};