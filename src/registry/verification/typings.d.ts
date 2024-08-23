export interface UserVerificationChoice {
  questions: Record<string, string>;
  userID: string;
  code: number;
  gdUsername: string;
  createdAt: number;
};

export interface RegisteredUserState extends Record<"verified" | "blacklisted", boolean> {
  lastUpdatedAt: number;
  userID: string;
  gdUsername: string;
};