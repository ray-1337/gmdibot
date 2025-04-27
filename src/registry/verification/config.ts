import ms from "ms";

import { type UserVerificationChoice } from "./typings";

export const requirements = {
  stars: 500,
  demons: 5,
  coins: {
    secret: 20,
    user: 50
  }
};

// user temporary cache
export const cache = new Map<string, UserVerificationChoice>();

export const verificationCacheExpireTime: number = ms("5m");

// cooldown
export const cooldownTimeState = ms("3m");
export const cooldown = new Map<string, number>();