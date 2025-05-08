import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

// This is for depricated urls'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  throw redirect(`/tracks/${params.slug}`);
};
