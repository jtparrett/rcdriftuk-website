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

  await prisma.lapScores.upsert({
    where: {
      judgeId_lapId: {
        judgeId,
        lapId,
      },
    },
    update: {
      score,
    },
    create: {
      judgeId,
      lapId,
      score,
    },
  });

  return redirect(`/judge/${judgeId}`);
};
