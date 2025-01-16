import { format, isThisWeek, isSameDay, isToday, isSameMonth } from "date-fns";

export const getEventDay = (startDate: Date, showDayOfWeek = true) => {
  if (isToday(startDate)) {
    return "Today";
  }

  if (showDayOfWeek && isThisWeek(startDate, { weekStartsOn: 1 })) {
    return format(startDate, "eeee");
  }

  return format(startDate, showDayOfWeek ? "eeee do MMMM" : "do MMMM");
};

export const getEventTime = (startDate: Date, endDate: Date) => {
  return `from ${format(startDate, "hh:mmaaa")}-${format(endDate, "hh:mmaaa")}`;
};

export const getEventDate = (startDate: Date, endDate: Date) => {
  if (isSameDay(startDate, endDate)) {
    return `${getEventDay(startDate)} ${getEventTime(startDate, endDate)}`;
  }

  const sameMonth = isSameMonth(startDate, endDate);
  return `${format(startDate, "do")}${sameMonth ? "" : " MMMM"}-${format(endDate, "do MMMM")} ${getEventTime(startDate, endDate)}`;
};
