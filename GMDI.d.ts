interface FarewellMemberConclusion {
  activateWhenComingBack: boolean;
  leavingSince: number;
  memberID: string;
}

interface WarningLastedOptions {
  since?: number | Date;
  due?: number | Date;
  full?: number;
  memberID: string;
  previousRoleList?: string[],
  level: 1 | 2 | 3; // specific level
  warningLogID: string
}

interface UserChatInterface {
  probability: number;
  sum: {
    week?: number[];
    today: number;
  };
  warning?: {
    current: boolean;
    since: Date | null;
  }
}