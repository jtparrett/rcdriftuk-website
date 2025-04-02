import { format, isThisWeek, isSameDay, isToday, isSameMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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
  const startHour = startDate.getHours().toString().padStart(2, "0");
  const startMinute = startDate.getMinutes().toString().padStart(2, "0");
  const endHour = endDate.getHours().toString().padStart(2, "0");
  const endMinute = endDate.getMinutes().toString().padStart(2, "0");

  return `from ${startHour}:${startMinute}-${endHour}:${endMinute}`;
};

export const getEventDate = (startDate: Date, endDate: Date) => {
  // Ensure dates are in UTC for comparison
  const utcStart = toZonedTime(startDate, "UTC");
  const utcEnd = toZonedTime(endDate, "UTC");

  if (isSameDay(utcStart, utcEnd)) {
    return `${getEventDay(utcStart)} ${getEventTime(utcStart, utcEnd)}`;
  }

  const sameMonth = isSameMonth(utcStart, utcEnd);
  return `${format(utcStart, "do")}${sameMonth ? "" : " MMMM"}-${format(utcEnd, "do MMMM")} ${getEventTime(utcStart, utcEnd)}`;
};
