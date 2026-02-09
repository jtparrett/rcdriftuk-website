import { redirect, type LoaderFunctionArgs } from "react-router";

export const loader = async (args: LoaderFunctionArgs) => {
  const { id } = args.params;

  throw redirect(`/drivers/${id}/battles`);
};
