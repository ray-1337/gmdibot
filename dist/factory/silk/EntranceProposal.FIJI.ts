import db from "quick.db";
import ms from "ms";

export default async function() {
  if (!db.get("replaceWelcomeMessageUser")) return;

  let memberLeaveProposal: [string, FarewellMemberConclusion][] = Object.entries(db.get("replaceWelcomeMessageUser"));
  
  for (const [id, val] of memberLeaveProposal) {
    if (Math.floor(Date.now() - val.leavingSince) > ms("14d")) {
      try {
        db.delete(`replaceWelcomeMessageUser.${id || val.memberID}`);
      } catch (err) {
        console.error(err);
      };

      continue;
    };
  };
}