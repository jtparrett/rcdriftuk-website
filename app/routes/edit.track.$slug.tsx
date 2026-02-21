import { Regions } from "~/utils/enums";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useFetcher, useLoaderData, useParams } from "react-router";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { TrackForm } from "~/components/TrackForm";
import { Box, Container, Divider, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { prisma } from "~/utils/prisma.server";
import { uploadFile } from "~/utils/uploadFile.server";
import type { Route } from "./+types/edit.track.$slug";
import { AppName } from "~/utils/enums";
import { useEffect } from "react";
import { RiCheckLine, RiExternalLinkLine } from "react-icons/ri";
import { PLATFORM_FEE_AMOUNT } from "~/utils/platformFee";

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: `${AppName} | ${data?.track.name} | Edit Track` },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  invariant(args.params.slug, "Slug is required");

  const track = await getUserOwnedTrackBySlug(args.params.slug, userId);

  const leaderboards = await prisma.leaderboards.findMany({
    where: {
      userId,
    },
  });

  return {
    track,
    leaderboards,
    currentUserId: userId,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  invariant(args.params.slug, "Slug is required");

  const track = await getUserOwnedTrackBySlug(args.params.slug, userId);

  const clonedRequest = args.request.clone();
  const formData = await clonedRequest.formData();

  const ownerUserIds = z
    .array(z.string().min(1))
    .min(1, "At least one owner is required")
    .parse(formData.getAll("ownerUserIds"));

  const data = z
    .object({
      image: z.union([z.instanceof(File), z.string()]),
      cover: z.union([z.instanceof(File), z.string()]).optional(),
      name: z.string(),
      description: z.string(),
      url: z.string(),
      address: z.string(),
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      leaderboardId: z.string().optional(),
      region: z.nativeEnum(Regions),
    })
    .parse(Object.fromEntries(formData.entries()));

  const { image, cover, ...update } = data;
  let imageUrl = "";
  let coverUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadFile(image);
  }

  if (typeof image === "string") {
    imageUrl = image;
  }

  if (cover instanceof File && cover.size > 0) {
    coverUrl = await uploadFile(cover);
  }

  if (typeof cover === "string") {
    coverUrl = cover;
  }

  await prisma.tracks.update({
    where: {
      id: track.id,
    },
    data: {
      ...update,
      image: imageUrl,
      cover: coverUrl,
      leaderboardId: data.leaderboardId === "" ? null : data.leaderboardId,
    },
  });

  const currentOwners = track.Owners.map((o) => o.userId);
  const toAdd = ownerUserIds.filter((id) => !currentOwners.includes(id));
  const toRemove = currentOwners.filter((id) => !ownerUserIds.includes(id));

  if (toAdd.length > 0) {
    await prisma.trackOwners.createMany({
      data: toAdd.map((uid) => ({ trackId: track.id, userId: uid })),
      skipDuplicates: true,
    });
  }

  if (toRemove.length > 0) {
    await prisma.trackOwners.deleteMany({
      where: {
        trackId: track.id,
        userId: { in: toRemove },
      },
    });
  }

  return redirect(`/tracks/${args.params.slug}`);
};

const TracksEditPage = () => {
  const { track, leaderboards, currentUserId } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<{ url: string }>();

  const isConnecting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.url) {
      window.location.href = fetcher.data.url;
    }
  }, [fetcher.data]);

  const handleConnectStripe = () => {
    fetcher.submit(null, {
      method: "POST",
      action: `/api/tracks/${params.slug}/stripe-connect`,
    });
  };

  return (
    <Container maxW={1100} px={4} py={8}>
      <Box
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.800"
        borderRadius="xl"
        maxW={600}
        mb={4}
      >
        <Box px={6} py={2} bgColor="gray.800" borderTopRadius="inherit">
          <styled.h1 fontWeight="bold" lineHeight={1.2}>
            Edit Track
          </styled.h1>
        </Box>
        <Box p={6}>
          <TrackForm track={track} leaderboards={leaderboards} currentUserId={currentUserId} />
        </Box>
      </Box>

      <Box
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.800"
        borderRadius="xl"
        maxW={600}
        mb={4}
        id="payments"
      >
        <Box px={6} py={2} bgColor="gray.800" borderTopRadius="inherit">
          <styled.h1 fontWeight="bold" lineHeight={1.2}>
            Payments
          </styled.h1>
        </Box>
        <Box p={6}>
          {track.stripeAccountEnabled ? (
            <Flex flexDir="column" gap={4}>
              <Flex alignItems="center" gap={2}>
                <Box
                  w={6}
                  h={6}
                  rounded="full"
                  bgColor="green.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <RiCheckLine />
                </Box>
                <styled.span fontWeight="semibold" color="green.400">
                  Stripe Connected
                </styled.span>
              </Flex>
              <styled.p color="gray.400" fontSize="sm">
                Your Stripe account is connected. You can now enable ticketing
                for events at this track. A &pound;
                {(PLATFORM_FEE_AMOUNT / 100).toFixed(2)} platform fee applies to
                each ticket sale.
              </styled.p>
              <Divider borderColor="gray.800" />
              <LinkButton
                to="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
              >
                View Stripe Dashboard
                <RiExternalLinkLine />
              </LinkButton>
            </Flex>
          ) : track.stripeAccountId ? (
            <Flex flexDir="column" gap={4}>
              <Flex alignItems="center" gap={2}>
                <Box
                  w={6}
                  h={6}
                  rounded="full"
                  bgColor="yellow.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <styled.span fontSize="xs" fontWeight="bold" color="black">
                    !
                  </styled.span>
                </Box>
                <styled.span fontWeight="semibold" color="yellow.400">
                  Setup Incomplete
                </styled.span>
              </Flex>
              <styled.p color="gray.400" fontSize="sm">
                Your Stripe account setup is incomplete. Please complete the
                onboarding process to enable ticketing.
              </styled.p>
              <Divider borderColor="gray.800" />
              <Button
                onClick={handleConnectStripe}
                disabled={isConnecting}
                isLoading={isConnecting}
              >
                Complete Stripe Setup
              </Button>
            </Flex>
          ) : (
            <Flex flexDir="column" gap={4}>
              <styled.p color="gray.400" fontSize="sm">
                Connect your Stripe account to enable ticketing for events at
                this track. You&apos;ll receive payouts directly to your bank
                account.
              </styled.p>
              <styled.p color="gray.500" fontSize="xs">
                A &pound;{(PLATFORM_FEE_AMOUNT / 100).toFixed(2)} platform fee
                applies to each ticket sale.
              </styled.p>
              <Divider borderColor="gray.800" />
              <Button
                onClick={handleConnectStripe}
                disabled={isConnecting}
                isLoading={isConnecting}
              >
                Connect Stripe Account
              </Button>
            </Flex>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default TracksEditPage;
