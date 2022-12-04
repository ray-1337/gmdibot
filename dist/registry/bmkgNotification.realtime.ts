// old-fashioned checking state of BMKG notification (alternative)
// retrieved via INDONESIA TSUNAMI EARLY WARNING SYSTEM
import { GMDIExtension } from "oceanic.js";
import redis from "../Cache";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { request } from "undici";
import {xml2json} from "xml-js";
import ms from "ms";
import {mercalliIntensityScale} from "./bmkgNotification"

import dayjs from "dayjs";
import dayjsTZ from "dayjs/plugin/timezone";
import dayjsUTC from "dayjs/plugin/utc";
dayjs.extend(dayjsTZ);
dayjs.extend(dayjsUTC);

let __ = false;

export default async (client: GMDIExtension) => {
  if (__) return;

  randomInterval(async () => {
    try {
      const endpoint = "https://bmkg-content-inatews.storage.googleapis.com/live30event.xml";
      const data = await request(endpoint, { method: "GET" });

      if (data.statusCode >= 400) throw await data.body.text();

      const rawXML = await data.body.text();
      const parsed = JSON.parse(xml2json(rawXML, {compact: true})) as GempaVirtualization;
      if (!parsed?.Infogempa?.gempa?.[0]) return;

      const latestEQ = parsed.Infogempa.gempa[0];
      const parsedTime = customInaTime(latestEQ.waktu._text);
      const localizedTime = dayjs(parsedTime).tz("Asia/Jakarta").utc(true);
      
      const cachedEQKey = "earthquakeAcute_realtimeINA";
      const cachedEarthQuake = await redis.get(cachedEQKey); // prevent replay
      const earthquakeID = parsedTime.getTime();
      if (cachedEarthQuake && cachedEarthQuake === String(earthquakeID)) return;
      
      // at least >= {specified}
      let limitMagnitudeToPost = 3.0;
      if (Number(latestEQ.mag._text) < limitMagnitudeToPost) {
        return console.log(`GMDI & BMKG (realtime alternative): Posted with ID_${earthquakeID} but lower mag; ${latestEQ.mag._text}`);
      };

      // host
      const generalChannel = "190826809896468480";
      const contentTemplate = "Stay safe, kawan-kawan. ⚠";
      const disclaimer = "Dalam beberapa menit pertama setelah gempa, parameter gempa dapat berubah dan tidak akurat, kecuali dianalisis ulang oleh seismologist.";

      const embed = new RichEmbed()
      .setColor(0xf56009)
      .setAuthor("Indonesia Tsunami Early Warning System (sub-alternative of BMKG)", "https://indonesiaexpat.id/wp-content/uploads/2022/02/WRS.png", "https://inatews.bmkg.go.id/")
      .setFooter("Powered by InaTEWS", "https://www.bmkg.go.id/asset/img/gempabumi/magnitude.png")
      .setTimestamp(new Date())
      .setTitle("Early Earthquake Alert")
      .setDescription(`Every earthquake with magnitude above >= ${limitMagnitudeToPost} will be posted here.`)
      
      embed
      .addField("Location (Latitude / Longitude)", `${latestEQ.lintang._text} / ${latestEQ.bujur._text}`)
      .addField("Magnitude / Mercalli Intensity Scale", `${latestEQ.mag._text} / ${mercalliIntensityScale(Number(latestEQ.mag._text))}`, true)
      .addField("Depth", latestEQ.dalam._text, true)
      .addField("Time Detected", localizedTime.toString())
      .addField("Disclaimer", disclaimer)
      .addField("Current Event", `[Click here for more information about the event](https://inatews.bmkg.go.id/web/detail2?name=${latestEQ.eventid._text})`)

      await client.rest.channels.createMessage(generalChannel, {
        content: contentTemplate,
        embeds: embed.toJSON(true)
      });

      await redis.set(cachedEQKey, earthquakeID);

      console.log(`GMDI & BMKG (realtime alternative): Posted with ID_${earthquakeID}`);

      return;
    } catch (error) {
      return console.error(error);
    };
  }, ms("2m"), ms("5m"));

  __ = true;
  console.log(`GMDI & BMKG (realtime alternative): Ready.`);
  return
};

interface GempaVirtualization {
  _declaration: {
    _attributes: {
      version: string
    }
  },
  Infogempa: {
    gempa: Array<GempaInterface>;
  };
};

interface GempaInterface {
  eventid: { _text: string }
  status: { _text: string }
  waktu: { _text: string }
  lintang: { _text: string }
  bujur: { _text: string }
  dalam: { _text: string }
  mag: { _text: string }
  fokal: { _text: string }
  area: { _text: string }
};

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min)) + Math.ceil(min));
};

function customInaTime(unparsedTime: string) {
  return new Date(unparsedTime.replace(/\//gi, "-").replace("  ", "T").split(".").shift()!);
};

function randomInterval(intervalFunction, minDelay: number, maxDelay: number) {
  let timeout: ReturnType<typeof setTimeout>;

  const runInterval = (): void => {
    timeout = globalThis.setTimeout(() => {
      intervalFunction();
      runInterval();
    }, randomNumber(minDelay, maxDelay));
  };

  runInterval();

  return {
    clear(): void {
      clearTimeout(timeout);
    },
  };
};