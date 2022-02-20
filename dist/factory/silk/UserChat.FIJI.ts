import db from "quick.db";
import GMDIBot from "../../handler/Client";
import Config from "../../config/config";

export default async function(client: GMDIBot) {
  // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  let data: [string, UserChatInterface][] = Object.entries(db.get("userChatRate"));

  for (const [id, content] of data) {

    // push the sum today to sum week, in order to get converted into averages
    let currentOverload: boolean = false;
    if (!content.sum.week) {
      db.set(`userChatRate.${id}.sum.week`, [content.sum.today]);
    } else {
      if (content.sum.week.length >= 7) {
        db.push(`userChatRate.${id}.sum.week`, content.sum.week.slice(1).push(content.sum.today));
        currentOverload = true;
      } else {
        db.push(`userChatRate.${id}.sum.week`, content.sum.today);
      };
    };

    // reset
    db.set(`userChatRate.${id}.sum.today`, 0);

    // calculation
    let arrayOfAvg = content.sum.week as number[];

    if (currentOverload) arrayOfAvg = [...arrayOfAvg.slice(1), content.sum.today];
    else arrayOfAvg = [...arrayOfAvg, content.sum.today];
    
    let sum = arrayOfAvg.reduce((acc, current) => acc + current);
    let res = Math.floor(sum / 7); // 7 is day of week
    db.set(`userChatRate.${id}.probability`, res);

    // pass the eligibility
    if (res >= Config.userChat.meta.threshold) {
      client.addGuildMemberRole(Config.guildID, id, Config.role.activeUser);
    };

    // inactivity
    if (arrayOfAvg.length === 7 && res <= Config.userChat.meta.threshold) {
      if (!content.warning?.current) {
        let varyObj: UserChatInterface["warning"] = { since: new Date(), current: true };
        db.set(`userChatRate.${id}.warning`, varyObj);
      }
      
      else if (content.warning?.current && content.warning.since && Math.floor((new Date().getTime() - content.warning.since.getTime()) / 864e5) >= Config.userChat.meta.resetAfterInDay) {
        client.removeGuildMemberRole(Config.guildID, id, Config.role.activeUser);
      };
    }  else {
      let varyObj: UserChatInterface["warning"] = { since: null, current: false };
      db.set(`userChatRate.${id}.warning`, varyObj);
    };

    continue;
  };
};