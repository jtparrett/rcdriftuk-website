import { format } from "date-fns";
import { redirect } from "react-router";
import { Regions } from "~/utils/enums";

export const loader = () => {
  const today = format(new Date(), "dd-MM-yy");
  throw redirect(`/calendar/${Regions.ALL}/week/${today}`);
};
