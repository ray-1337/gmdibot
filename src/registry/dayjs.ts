import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"

[utc, timezone, localizedFormat, customParseFormat, isSameOrBefore]
  .forEach(func => dayjs.extend(func));