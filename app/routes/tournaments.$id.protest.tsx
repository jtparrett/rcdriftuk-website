import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { getAuth } from "~/utils/getAuth.server";
import { getTournament } from "~/utils/getTournament.server";
import { getUser } from "~/utils/getUser.server";
import { prisma } from "~/utils/prisma.server";

const canProtest = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  const user = await getUser(userId);

  if (!user) {
    throw new Response(null, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  const tournament = await getTournament(id);

  if (!tournament || !tournament.nextBattle) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const isBattlingDriver =
    tournament.nextBattle.driverLeft?.driverId === user.driverId ||
    tournament.nextBattle.driverRight?.driverId === user.driverId;

  if (!isBattlingDriver) {
    throw new Response(null, {
      status: 403,
      statusText: "Forbidden",
    });
  }

  const judgingCompleteForNextBattle =
    tournament.nextBattle.BattleVotes.length === tournament.judges.length;

  if (!judgingCompleteForNextBattle) {
    throw new Response(null, {
      status: 403,
      statusText: "Forbidden",
    });
  }

  return {
    nextBattleId: tournament.nextBattle.id,
    user,
    id,
  };
};

export const loader = async (args: LoaderFunctionArgs) => {
  await canProtest(args);
  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const { nextBattleId, user, id } = await canProtest(args);

  await prisma.battleProtests.create({
    data: {
      battleId: nextBattleId,
      driverId: user.driverId,
    },
  });

  return redirect(`/tournaments/${id}/overview`);
};

const TournamentProtestPage = () => {
  return (
    <ConfirmationForm
      title="Are you sure you want to protest?"
      disclaimer="This may incur a monetary penalty if the protest is overruled by the judges. Their decision will be final."
      confirmText="I'm sure, submit my protest"
    />
  );
};

export default TournamentProtestPage;
