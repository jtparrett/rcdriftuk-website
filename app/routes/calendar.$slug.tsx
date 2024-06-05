import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  throw redirect(`/tracks/${params.slug}`);
};
