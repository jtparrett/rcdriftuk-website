import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
export const loader = async (args: LoaderFunctionArgs) => {
  if (!args.params.tab) {
    throw redirect(`/tracks/${args.params.slug}/events`);
  }

  return null;
};
