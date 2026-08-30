import ms from "ms";

import { type UserVerificationChoice } from "./typings";

export const requirements = {
  stars: 50,
  demons: 1,
  coins: {
    secret: 10,
    user: 20
  }
};

// user temporary cache
export const cache = new Map<string, UserVerificationChoice>();

export const verificationCacheExpireTime: number = 15;

// cooldown
export const cooldownTimeState = ms("3m");
export const cooldown = new Map<string, number>();