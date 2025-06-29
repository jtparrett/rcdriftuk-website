import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export const loader = async (args: LoaderFunctionArgs) => {
  throw redirect(`/tracks/${args.params.slug}/events`);
};
