import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/utils/prisma.server";

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { id: judgeId, lapId } = z
    .object({
      id: z.coerce.string(),
      lapId: z.coerce.number(),
    })
    .parse(params);

  const formData = await request.formData();

  const score = z.coerce.number().parse(formData.get("score"));
  // const angle = z.coerce.number().parse(formData.get("angle"));
  // const style = z.coerce.number().parse(formData.get("style"));

  // const score = line + angle + style;

  await prisma.lapScores.create({
    data: {
      judgeId,
      lapId,
      score,
    },
  });

  return redirect(`/judge/${judgeId}`);
};
