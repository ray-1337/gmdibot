export interface UserVerificationChoice extends Record<"userID" | "gdUsername" | "submissionReferenceId", string>, Record<"code" | "createdAt", number> {
  questions: Record<string, string>;
};

export interface RegisteredUserState extends Record<"userID" | "gdUsername", string>, Partial<Pick<UserVerificationChoice, "questions" | "submissionReferenceId"> & Record<"verified" | "blacklisted", boolean>> {
  lastUpdatedAt: number;
};