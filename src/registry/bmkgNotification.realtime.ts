import { Client, Constants, File } from "oceanic.js";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { request } from "undici";
import {xml2json} from "xml-js";
import ms from "ms";
import dayjs from "dayjs";
import { randomInterval, customInaTime, colorizedMagnitudeEmbed, mercalliIntensityScale, isDevMode } from "../handler/Util";

const timezone = "Asia/Jakarta";
const cached = new Map<string, boolean>();

let intervalStarted = false;
let lastModified = "";

export default async (client: Client) => {
  if (intervalStarted) return;

  randomInterval(async () => {
    try {
      const endpoint = "https://bmkg-content-inatews.storage.googleapis.com/live30event.xml";
      const checkHeader = await request(endpoint, { method: "HEAD" });
      if (!checkHeader || checkHeader.statusCode >= 400) throw await checkHeader.body.text();

      const lastModifiedHeader = String(checkHeader?.headers?.["last-modified"]);
      if (lastModifiedHeader?.length) {
        if (lastModifiedHeader === lastModified) {
          return;
        } else {
          lastModified = lastModifiedHeader;
        };
      };

      const data = await request(endpoint, { method: "GET" });
      if (data.statusCode >= 400) throw await data.body.text();

      const rawXML = await data.body.text();
      const parsed = JSON.parse(xml2json(rawXML, {compact: true})) as GempaVirtualization;
      if (!parsed?.Infogempa?.gempa?.[0]) return;

      const latestEQ = parsed.Infogempa.gempa[0];
      const parsedTime = customInaTime(latestEQ.waktu._text);

      const currentTime = dayjs().tz(timezone);
      const localizedTime = dayjs(parsedTime).tz(timezone);
      const late = ms("15m");

      // check if its already late
      if (currentTime.valueOf() - localizedTime.valueOf() > late) {
        // console.log(currentTime.valueOf(), localizedTime.valueOf(), currentTime.valueOf() - localizedTime.valueOf() > late)
        return;
      };

      const earthquakeID = latestEQ.eventid._text;
      const cachedEarthQuake = cached.get(earthquakeID); // prevent replay
      if (cachedEarthQuake) return;
      
      // at least >= {specified}
      let limitMagnitudeToPost = 4;
      if (Number(latestEQ.mag._text) < limitMagnitudeToPost) {
        cached.set(earthquakeID, true);
        
        if (isDevMode) {
          console.log(`GMDI & BMKG (realtime alternative): Posted with ID_${earthquakeID} but lower mag; ${latestEQ.mag._text}`);
        };

        return;
      };

      if (!latestEQ.area._text.toLowerCase().match(/(java|sumatra|sulawesi|bali|borneo)/gim)) {
        cached.set(earthquakeID, true);
        
        if (isDevMode) {
          console.log(`GMDI & BMKG (realtime alternative): Posted with ID_${earthquakeID} but not in an indonesia-related place; ${latestEQ.area._text}`);
        };

        return;
      };

      // host
      const generalChannel = "1062203494691520522";
      // const contentTemplate = "Stay safe, kawan-kawan. ⚠";
      // const disclaimer = "Kalkulasi gempa tidak begitu akurat dalam menit pertama, dan data akan berubah sewaktu-waktu oleh tim ahli seismologi.";

      const earthquakeColor = colorizedMagnitudeEmbed(+latestEQ.mag._text);
      const embed = new RichEmbed()
      .setColor(earthquakeColor)
      .setAuthor("Indonesia Tsunami Early Warning System (sub-alternative of BMKG)", "https://indonesiaexpat.id/wp-content/uploads/2022/02/WRS.png", "https://inatews.bmkg.go.id/")
      .setFooter("Provided by InaTEWS, Mapbox", "https://www.bmkg.go.id/asset/img/gempabumi/magnitude.png")
      .setTimestamp(new Date())
      .setTitle(`${latestEQ.area._text}`)
      // .setDescription(`Every earthquake with magnitude above >= ${limitMagnitudeToPost} will be posted here.`)
      
      const lintang = latestEQ.lintang._text;
      const bujur = latestEQ.bujur._text;
      embed
      .addField("Lintang Bujur", `${latestEQ.area._text} (${lintang} / ${bujur})`)
      .addField("Skala", `${latestEQ.mag._text} / ${mercalliIntensityScale(+latestEQ.mag._text)}`, true)
      .addField("Kedalaman", `${latestEQ.dalam._text} km`, true)
      .addField("Waktu Terdeteksi", `<t:${Math.round(localizedTime.valueOf() / 1000)}>`, true)
      // .addField("Disclaimer", disclaimer);

      // mapbox
      const mapboxEndpoint = `https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/pin-l+${earthquakeColor.toString(16)}(${bujur},${lintang})/${bujur},${lintang},6.95,0/1280x800?access_token=${process.env.MAPBOX_TOKEN}`;
      const mapboxFetch = await request(mapboxEndpoint, {method: "GET"});

      let files: File[] = [];

      if (mapboxFetch.statusCode >= 400) {
        console.error(await mapboxFetch.body.text());
        console.warn(`GMDI & BMKG (realtime alternative): Failed to fetch mapbox`);
      } else {
        embed.setImage(`attachment://gmdi_attitude_eq_${earthquakeID}.png`);
        files.push({
          name: `gmdi_attitude_eq_${earthquakeID}.png`,
          contents: Buffer.from(await mapboxFetch.body.arrayBuffer())
        });
      };

      const postedBMKGMessage = await client.rest.channels.createMessage(generalChannel, {
        // content: contentTemplate,
        embeds: embed.toJSON(true),
        files,
        components: [{
          type: Constants.ComponentTypes.ACTION_ROW,
          components: [{
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.LINK,
            emoji: {id: null, name: "📑"},
            label: "More information",
            url: `https://inatews.bmkg.go.id/web/detail2?name=${latestEQ.eventid._text}`
          }]
        }]
      });

      if (postedBMKGMessage?.channel && postedBMKGMessage.channel.type === Constants.ChannelTypes.GUILD_ANNOUNCEMENT) {
        try {
          await postedBMKGMessage.crosspost();
        } catch {}
      };

      cached.set(earthquakeID, true);

      if (isDevMode) {
        console.log(`GMDI & BMKG (realtime alternative): Posted with ID_${latestEQ.eventid._text}`);
      };

      return;
    } catch (error) {
      return console.error(error);
    };
  }, ms("1m"), ms("2m"));

  intervalStarted = true;
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