import { redirect, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  throw redirect(`/leaderboards/${id}/standings`);
};
