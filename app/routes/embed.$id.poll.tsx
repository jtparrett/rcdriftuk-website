import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/prisma.server";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { add, format } from "date-fns";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `${data?.track.name} Attendance`,
    },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;

  const track = await prisma.tracks.findFirst({
    where: {
      slug: id,
    },
  });

  invariant(track, "Track not found");

  const pollEntries = await prisma.pollEntries.findMany({
    where: {
      trackId: track.id,
    },
  });

  const days = [...Array(7)].map((_, i) =>
    format(add(new Date(), { days: i }), "EEEE, do LLL")
  );

  return { track, days, pollEntries };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;

  const track = await prisma.tracks.findFirst({
    where: {
      slug: id,
    },
  });

  invariant(track, "Track not found");

  const formData = await request.formData();

  const entryId = z.string().parse(formData.get("day"));
  const deviceId = z.string().parse(formData.get("deviceId"));

  const existingEntry = await prisma.pollEntries.findFirst({
    where: {
      entryId,
      trackId: track.id,
      deviceId,
    },
  });

  if (existingEntry) {
    await prisma.pollEntries.delete({
      where: {
        id: existingEntry.id,
      },
    });
  } else {
    await prisma.pollEntries.create({
      data: {
        entryId,
        trackId: track.id,
        deviceId,
      },
    });
  }

  return redirect(`/embed/${params.id}/poll`);
};

const TrackEmbedPoll = () => {
  const { track, days, pollEntries } = useLoaderData<typeof loader>();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    setDeviceId(deviceId);
  }, []);

  return (
    <Container maxW={480} py={8}>
      <styled.h1
        fontWeight="bold"
        fontSize="2xl"
        pb={8}
        textAlign="center"
        textWrap="balance"
      >
        Which day are you attending {track.name}?
      </styled.h1>
      <Flex gap={2} flexDir="column">
        {days.map((value, index) => {
          const totalEntries = pollEntries.filter(
            (entry) => entry.entryId === value
          ).length;
          const max = 20;

          return (
            <form key={index} method="post">
              <styled.button
                display="flex"
                w="full"
                pos="relative"
                color="white"
                fontWeight="semibold"
                p={2}
                justifyContent="center"
                alignItems="center"
                borderRadius="md"
                bg="gray.800"
                overflow="hidden"
                zIndex={1}
                type="submit"
              >
                <input type="hidden" name="day" value={value} />
                <input type="hidden" name="deviceId" value={deviceId ?? ""} />
                <Box
                  pos="absolute"
                  top={0}
                  left={0}
                  h="full"
                  style={{
                    width: `${(totalEntries / max) * 100}%`,
                  }}
                  bg="brand.500"
                  zIndex={-1}
                />
                {value} ({totalEntries})
              </styled.button>
            </form>
          );
        })}
      </Flex>
    </Container>
  );
};

export default TrackEmbedPoll;
