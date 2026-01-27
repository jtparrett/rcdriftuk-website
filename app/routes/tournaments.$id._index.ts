import { redirect, type LoaderFunctionArgs } from "react-router";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  throw redirect(`/tournaments/${params.id}/overview`);
};
