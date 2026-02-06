import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { z } from "zod";
import { prisma } from "~/utils/prisma.server";
import { CarSetupSummary } from "~/components/CarSetupSummary";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);

  const carSetupChanges = prisma.carSetupChanges.findMany({
    where: {
      user: {
        driverId,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return carSetupChanges;
};

const Page = () => {
  const carSetupChanges = useLoaderData<typeof loader>();

  return <CarSetupSummary history={carSetupChanges} />;
};

export default Page;
