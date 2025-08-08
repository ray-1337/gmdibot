import dayjs from "dayjs";
import dayjsUTC from "dayjs/plugin/utc";
import dayjsTimezone from 'dayjs/plugin/timezone';
import dayjsLocalize from 'dayjs/plugin/localizedFormat';
import dayjsCustomParseFormat from 'dayjs/plugin/customParseFormat';
import dayjsSameBefore from "dayjs/plugin/isSameOrBefore"

dayjs.extend(dayjsTimezone);
dayjs.extend(dayjsUTC);
dayjs.extend(dayjsLocalize);
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsSameBefore);