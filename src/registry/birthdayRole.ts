import { Member, Client, JSONMember } from "oceanic.js";
import nodeSchedule from "node-schedule";
import dayjs from "dayjs";
import { birthdayRoleID, gmdiGuildID } from "../handler/Config";
import { randomNumber, delay, isDevMode } from "../handler/Util";
import ms from "ms";

export async function rescheduleBirthdayPeople(client: Client) {
  const fixedLimit: number = 1000;
  let members: Member[] = [];

  while (members.length % fixedLimit === 0) {
    const newMembers = await client.rest.guilds.getMembers(gmdiGuildID, {
      after: members?.length ? members[members.length - 1].id : undefined,
      limit: fixedLimit
    });

    if (newMembers.length <= 0) {
      break;
    };

    members = members.concat(newMembers);

    await delay(randomNumber(ms("250ms"), ms("5s")));
  };

  const filteredMembers = members.filter(val => val.roles.includes(birthdayRoleID));
  if (filteredMembers?.length) {
    for (const member of filteredMembers) {
      scheduleRemoval(client, member.id, gmdiGuildID);
    };

    console.log(`[${filteredMembers.length} member(s)] is/are scheduled for birthday removal.`);
  };

  return;
};

const scheduleRemoval = (client: Client, userID: string, guildID: string) => {
  if (Object.keys(nodeSchedule.scheduledJobs).some(val => val.match(userID))) {
    return;
  };

  // removal time: 12:00 AM (GMT+7 / WIB)
  const nextDayRemovalTime = dayjs().utc().set("hour", 23).set("minute", 59).set("second", 59).tz("Asia/Jakarta");
  const nextDayJSDate = nextDayRemovalTime.toDate();
  if (isNaN(nextDayJSDate.getTime())) {
    return;
  };

  if (isDevMode === true) {
    console.log(`[${userID}] is scheduled for birthday removal on ${nextDayJSDate.toISOString()}`)
  };

  nodeSchedule.scheduleJob(`ultah_${userID}`, nextDayJSDate, async () => {
    try {
      await client.rest.guilds.removeMemberRole(guildID, userID, birthdayRoleID, "[GMDIBot] Birthday Over");
    } catch (error) {
      console.error(error);
    };
  });

  return;
};

export default async (client: Client, member: Member, oldMember: JSONMember | null) => {
  if (member.roles.includes(birthdayRoleID) && !oldMember?.roles.includes(birthdayRoleID)) {
    scheduleRemoval(client, member.id, member.guildID);
  } else {
    nodeSchedule.cancelJob(`ultah_${member.id}`);
  };
};