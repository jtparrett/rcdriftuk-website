import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
export const loader = async (args: LoaderFunctionArgs) => {
  if (!args.params.tab) {
    throw redirect(`/tracks/${args.params.slug}/events`);
  }

  return null;
};
