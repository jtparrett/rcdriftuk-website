import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Container, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);

  const judges = await prisma.tournamentJudges.findMany({
    where: {
      tournamentId: id,
    },
  });

  return judges;
};

const TournamentsJudgesPage = () => {
  const judges = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2}>
      <styled.h1>Judges</styled.h1>
      {judges.map((judge) => {
        return <styled.p key={judge.id}>{judge.name}</styled.p>;
      })}
    </Container>
  );
};

export default TournamentsJudgesPage;
