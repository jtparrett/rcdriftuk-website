import { redirect, type LoaderFunctionArgs } from "react-router";
import { getTheme } from "~/utils/theme";

export const loader = async (args: LoaderFunctionArgs) => {
  const { id } = args.params;
  const theme = getTheme();

  if (theme.key === "sdc") {
    throw redirect(`/drivers/${id}/tournaments`);
  }

  throw redirect(`/drivers/${id}/battles`);
};
