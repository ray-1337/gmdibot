export interface UserVerificationChoice extends Record<"userID" | "gdUsername" | "submissionReferenceId", string>, Record<"code" | "createdAt", number> {
  questions: Record<string, string>;
};

export interface RegisteredUserState extends Record<"userID" | "gdUsername", string>, Record<"verified" | "blacklisted", boolean>, Partial<Pick<UserVerificationChoice, "questions" | "submissionReferenceId">> {
  lastUpdatedAt: number;
};