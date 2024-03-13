import { GMDIExtension } from "oceanic.js";
import { EmbedBuilder as RichEmbed } from "@oceanicjs/builders";
import { request } from "undici";
import nodeSchedule from "node-schedule";
import { shuffle } from "../handler/Util";

import dayjs from "dayjs";
import dayjsUTC from "dayjs/plugin/utc";
import dayjsTimezone from 'dayjs/plugin/timezone';
import dayjsLocalize from 'dayjs/plugin/localizedFormat';
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat';
import dayjsSameBefore from "dayjs/plugin/isSameOrBefore"

dayjs.extend(dayjsTimezone);
dayjs.extend(dayjsUTC);
dayjs.extend(dayjsLocalize);
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsSameBefore);

const endpointVersion: number = 2;

async function initiatePrayingTime(client: GMDIExtension, addOneMoreDay?: boolean) {
  let capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // gmdi majority is from Jabodetabek.
  let currentTimezone = "Asia/Jakarta";
  let currentTime = dayjs().tz(currentTimezone);

  if (addOneMoreDay) {
    currentTime = currentTime.add(1, "day");
  };

  let currentMonth = currentTime.get("month") + 1;

  // its not around april anymore
  // if (currentMonth != 4) return;

  const congratsMessage = [
    "Selamat menunaikan ibadah $1, semoga Allah menerima amalan kita.",
    "Selamat menunaikan ibadah $1, semoga malam ini kita diberi keberkahan dan perlindungan dari segala kejahatan.",
    "Selamat menunaikan ibadah $1, semoga hari kita dipenuhi dengan keberkahan dan kebaikan.",
    "Selamat menunaikan ibadah $1, semoga Allah memberi kelancaran dalam setiap urusan kita.",
    "Selamat menunaikan ibadah $1, semoga Allah senantiasa melindungi kita dan memberikan keberkahan dalam hidup kita."
  ];

  // picked from https://kemenag.go.id/
  const prayerAPIFetch = await request(`https://api.myquran.com/v${endpointVersion}/sholat/jadwal/1301/${new Date().getFullYear()}/${currentMonth}/${currentTime.get("date")}`);
  if (!prayerAPIFetch?.body || prayerAPIFetch.statusCode >= 400) {
    return console.error(await prayerAPIFetch.body.text());
  };

  const rawData = await prayerAPIFetch.body.json() as { data?: PrayerAPIConfig };

  const data = rawData?.data;
  if (!data?.jadwal) return;

  let prayerTiming = Object.entries(data.jadwal).filter(x => !x[0].match(/(tanggal|terbit|date)/gi)) as Array<[PrayerType, string]>;

  for (let i = 0; i < prayerTiming.length; i++) {
    // thanks to Abdi#5670
    let importancePrayerType: Array<PrayerType> = ["subuh", "maghrib", "dzuhur", "ashar", "isya"];
    let prayerTypeTime = prayerTiming[i][0];

    // skip the loop if its not a part of importancePrayerType
    if (!importancePrayerType.includes(prayerTypeTime)) continue;

    let timeFormat = "HH:mm";
    let prayerSupposeTime = prayerTiming[i][1];
    let prayTimeListed = dayjs(prayerSupposeTime, timeFormat).set("date", currentTime.date()).tz(currentTimezone, true);

    if (addOneMoreDay) {
      prayTimeListed.add(1, "day");
    };

    let inRegionOfPray =
      currentTime.isBefore(currentTime.startOf("date"), "ms") &&
      currentTime.isAfter(dayjs(prayerTiming[0][1], timeFormat).set("date", currentTime.date()).tz(currentTimezone, true), "ms");

    if (addOneMoreDay || currentTime.isSameOrBefore(prayTimeListed)) {
      // prevent multiple announcement
      // the times from its API may changed everytime
      let prayersSchedule = nodeSchedule.scheduledJobs;
      let existedSchedule = Object.keys(prayersSchedule);
      if (existedSchedule.find(i => i.startsWith(prayerTypeTime) && i.endsWith(currentTime.get("date").toString()))) {
        continue;
      };

      nodeSchedule.scheduleJob(`${prayerTypeTime}_${prayerSupposeTime}_${currentTime.get("date")}`, prayTimeListed.toDate(), function () {
        const generalChannelID = "190826809896468480";
        const prayerTypeCapitalize = capitalize(prayerTypeTime);

        const embed = new RichEmbed()
          .setColor(0xF8F8F8)
          .setTitle(prayerTypeCapitalize)
          .setDescription(`<t:${Math.round(prayTimeListed.valueOf() / 1000)}:F>`)
          .setFooter("Data diambil dari Kemenag Jakarta Pusat. Waktu mungkin bervariasi di setiap daerah.");

        client.rest.channels.createMessage(generalChannelID, {
          content: `${shuffle(congratsMessage)[0].replace("$1", prayerTypeCapitalize)}`,
          embeds: embed.toJSON(true)
        }).catch(() => { });

        // reinitiate if its reached
        if (prayerTypeTime === importancePrayerType.pop()) {
          return initiatePrayingTime(client, true);
        };
      });
    } else {
      // its last (isya)
      if (i == prayerTiming.length && !inRegionOfPray) {
        initiatePrayingTime(client, true);
        break;
      };

      continue;
    };
  };
};

export default async (client: GMDIExtension) => {
  try {
    initiatePrayingTime(client);
    console.log("Praying Time Announcement: Ready.");
  } catch (error) {
    return console.error(error);
  };
};

type PrayerType = "ashar" | "dhuha" | "dzuhur" | "imsak" | "isya" | "maghrib" | "subuh";

interface PrayerAPIConfig {
  daerah: string;
  id: string;
  bujur: string;
  lat: number;
  lintang: string;
  lon: number;
  lokasi: string;
  jadwal?: Record<PrayerType, string>;
  koordinat: {
    bujur: string;
    lat: number;
    lintang: string;
    lon: number;
  };
};