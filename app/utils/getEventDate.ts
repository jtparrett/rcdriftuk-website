import { format, isThisWeek, isToday } from "date-fns";

export const getEventDay = (startDate: Date) => {
  if (isToday(startDate)) {
    return "Today";
  }

  if (
    isThisWeek(startDate, {
      weekStartsOn: 1,
    })
  ) {
    return format(startDate, "eeee");
  }

  return format(startDate, "eeee do MMMM");
};

export const getEventTime = (startDate: Date, endDate: Date) => {
  return `from ${format(startDate, "hh:mmaaa")} - ${format(
    endDate,
    "hh:mmaaa"
  )}`;
};

export const getEventDate = (startDate: Date, endDate: Date) => {
  return `${getEventDay(startDate)} ${getEventTime(startDate, endDate)}`;
};
