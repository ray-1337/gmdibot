import Eris from "eris";
import undici from "undici";
import nodeSchedule from "node-schedule";

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
dayjs.extend(dayjsSameBefore)

async function initiatePrayingTime(client: Eris.Client, addOneMoreDay?: boolean) {
  let capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // gmdi majority is from Jabodetabek.
  let currentTimezone = "Asia/Jakarta";
  let currentTime = dayjs().tz(currentTimezone);
  let currentMonth = currentTime.get("month") + 1;

  // its not around april anymore
  if (currentMonth != 4) return;
  
  let data: PrayerAPIConfig | null | undefined;

  // appropriate message to say
  const sentencePrefix = ["jangan lupa", "selamat menunaikan ibadah"];
  const prayPostfix = ["adzan", "sholat"];

  let random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const appropriateMessage: Record<PrayerType, string> = {
    "imsak": `yok guys, bentar lagi sholat subuh`,
    "subuh": `${random(sentencePrefix)} sholat subuh`,
    "dhuha": `${random(sentencePrefix)} sholat dhuha`,
    "dzuhur": `${random(sentencePrefix)} sholat dzuhur`,
    "ashar": `${random(sentencePrefix)} sholat azhar`,
    "maghrib": `${random(sentencePrefix)} sholat maghrib, dan selamat berbuka puasa`,
    "isya": `${random(sentencePrefix)} sholat isya`
  };

  // picked from https://kemenag.go.id/
  async function retrieveData() {
    let apiEndpoint = `https://api.myquran.com/v1/sholat/jadwal/1301/2022/${currentMonth}/${String(addOneMoreDay ? currentTime.get("dates") + 1 : currentTime.get("date"))}`;
    let apiFetch = await undici.request(apiEndpoint).catch(() => {});

    if (apiFetch) {
      data = (await apiFetch.body.json()).data;
      return;
    } else {
      return;
    };
  };

  await retrieveData();

  if (data) {
    let prayerTiming = Object.entries(data.jadwal).filter(x => !x[0].match(/(tanggal|terbit|date)/gi)) as Array<[PrayerType, string]>;

    for (let i = 0; i < prayerTiming.length; i++) {
      // thanks to Abdi#5670
      let importancePrayerType: Array<PrayerType> = ["imsak", "subuh", "maghrib", "dzuhur", "ashar"];
      let prayerTypeTime = prayerTiming[i][0];

      // skip the loop if its not a part of importancePrayerType
      if (!importancePrayerType.includes(prayerTypeTime)) continue;

      let timeFormat = "HH:mm";
      let prayerSupposeTime = prayerTiming[i][1];
      let prayTimeListed = dayjs(prayerSupposeTime, timeFormat).set("date", currentTime.date()).tz(currentTimezone, true);

      if (addOneMoreDay) {
        prayTimeListed.add(24, "h")
      };

      let inRegionOfPray = 
        currentTime.isBefore(addOneMoreDay ? currentTime.add(24, "h").startOf("date") : currentTime.startOf("date"), "ms") &&
        currentTime.isAfter(dayjs(prayerTiming[0][1], timeFormat).tz(currentTimezone, true), "ms");
  
      if (currentTime.isSameOrBefore(prayTimeListed)) {
        // prevent multiple announcement
        // the times from its API may changed everytime
        let prayersSchedule = nodeSchedule.scheduledJobs;
        let existedSchedule = Object.keys(prayersSchedule);
        if (existedSchedule.find(i => i.startsWith(prayerTypeTime) && i.endsWith(currentTime.get("date").toString()))) {
          continue;
        };

        nodeSchedule.scheduleJob(`${prayerTypeTime}_${prayerSupposeTime}_${currentTime.get("date")}`, prayTimeListed.toDate(), function() {
          const generalChannelID = "190826809896468480";

          const embed = new Eris.RichEmbed()
          .setColor(0xF8F8F8)
          .setTitle(capitalize(prayerTypeTime))
          .setDescription(`<t:${Math.round(prayTimeListed.valueOf() / 1000)}:t> WIB`)
          .setFooter("Data diambil dari Kemenag Jakarta Pusat. Waktu mungkin bervariasi di setiap daerah.");

          client.createMessage(generalChannelID, {content: appropriateMessage[prayerTypeTime], embeds: [embed]}).catch(() => {});
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
};

export default async (client: Eris.Client) => {
  try {
    initiatePrayingTime(client)
  } catch (error) {
    return console.error(error);
  };
};

type PrayerType = Exclude<keyof PrayerAPIConfig["jadwal"], "tanggal" | "terbit" | "date">;

interface PrayerAPIConfig {
  daerah: string;
  id: string;
  bujur: string;
  lat: number;
  lintang: string;
  lon: number;
  lokasi: string;
  jadwal: {
    ashar: string;
    date: string;
    dhuha: string;
    dzuhur: string;
    imsak: string;
    isya: string;
    maghrib: string;
    subuh: string;
    tanggal: string;
    terbit: string;
  };
  koordinat: {
    bujur: string;
    lat: number;
    lintang: string;
    lon: number;
  };
};