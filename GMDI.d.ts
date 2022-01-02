interface FarewellMemberConclusion {
  activateWhenComingBack: boolean;
  leavingSince: number | Date;
}

interface WarningLastedOptions {
  since?: number | Date;
  due?: number | Date;
  full?: number | Date;
  memberID?: string;
  previousRoleList?: string[],
  level: number,
  warningLogID?: string
}