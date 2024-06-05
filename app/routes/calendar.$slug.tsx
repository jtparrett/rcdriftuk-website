import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/react";

// This is for depricated urls'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  throw redirect(`/tracks/${params.slug}`);
};
