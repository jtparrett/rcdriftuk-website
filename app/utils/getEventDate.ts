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

export const getTime = (date: Date) => {
  let hours = date.getHours();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // convert 0 to 12
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (minutes === "00") {
    return `${hours}${ampm}`;
  }

  return `${hours}:${minutes}${ampm}`;
};

export const getEventTime = (startDate: Date, endDate: Date) => {
  return `from ${getTime(startDate)}-${getTime(endDate)}`;
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
