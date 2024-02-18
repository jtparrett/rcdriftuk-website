export const dateWithoutTimezone = (dateString: string) => {
  const date = new Date(dateString.slice(0, -1));
  return date;
  return new Date(date.toISOString().slice(0, -1));
};
