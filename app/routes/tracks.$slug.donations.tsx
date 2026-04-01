import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { RiHeartFill, RiEyeOffFill, RiUserFill } from "react-icons/ri";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Dialog } from "~/components/Dialog";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { DonationStatus } from "~/utils/enums";

const PRESET_AMOUNTS = [5, 10, 20, 50];

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);

  const track = await prisma.tracks.findFirst({
    where: { slug },
    select: { id: true, stripeAccountEnabled: true },
  });

  if (!track) throw new Response("Track not found", { status: 404 });

  const donations = await prisma.donations.findMany({
    where: {
      trackId: track.id,
      status: DonationStatus.CONFIRMED,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          driverId: true,
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
  });

  return {
    donations,
    isSignedIn: !!userId,
    stripeAccountEnabled: track.stripeAccountEnabled,
  };
};

const DonateModal = ({
  open,
  onClose,
  slug,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
}) => {
  const fetcher = useFetcher();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.url) {
      window.location.href = fetcher.data.url;
    }
  }, [fetcher.data]);

  const handleSubmit = () => {
    if (!selectedAmount) return;
    fetcher.submit(
      JSON.stringify({
        amount: selectedAmount,
        message: message || undefined,
        anonymous,
      }),
      {
        method: "post",
        action: `/api/tracks/${slug}/donate`,
        encType: "application/json",
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <styled.h2 fontSize="lg" fontWeight="bold" mb={4}>
        Make a Donation
      </styled.h2>

      <styled.p fontSize="sm" color="gray.400" mb={4}>
        Select an amount (GBP)
      </styled.p>

      <Flex gap={2} mb={4} flexWrap="wrap">
        {PRESET_AMOUNTS.map((preset) => (
          <Button
            key={preset}
            variant={selectedAmount === preset ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelectedAmount(preset)}
            type="button"
          >
            £{preset}
          </Button>
        ))}
      </Flex>

      <styled.textarea
        placeholder="Add a message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        w="full"
        p={2}
        rounded="xl"
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.700"
        fontSize="sm"
        mb={4}
        rows={3}
        resize="none"
        _focus={{ borderColor: "brand.500", outline: "none" }}
      />

      <Flex
        alignItems="center"
        justifyContent="space-between"
        mb={4}
        p={3}
        rounded="xl"
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.700"
      >
        <Flex alignItems="center" gap={2}>
          <RiEyeOffFill size={16} color={anonymous ? "white" : "gray"} />
          <styled.span fontSize="sm" fontWeight="medium">
            Donate anonymously
          </styled.span>
        </Flex>
        <styled.button
          type="button"
          onClick={() => setAnonymous(!anonymous)}
          w={11}
          h={6}
          rounded="full"
          bgColor={anonymous ? "brand.600" : "gray.700"}
          position="relative"
          transition="background-color .18s"
          cursor="pointer"
          flexShrink={0}
        >
          <styled.span
            display="block"
            w={5}
            h={5}
            rounded="full"
            bgColor="white"
            position="absolute"
            top="2px"
            left={anonymous ? "calc(100% - 22px)" : "2px"}
            transition="left .18s"
          />
        </styled.button>
      </Flex>

      <Flex gap={2}>
        <Button
          variant="primary"
          flex={1}
          onClick={handleSubmit}
          disabled={!selectedAmount || isSubmitting}
          isLoading={isSubmitting}
          type="button"
        >
          Continue to Payment
        </Button>
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
      </Flex>

      <styled.p fontSize="xs" color="gray.500" mt={3}>
        A £1.50 platform fee applies. You&apos;ll be redirected to Stripe to
        complete your payment.
      </styled.p>
    </Dialog>
  );
};

const TrackDonationsPage = () => {
  const { donations, isSignedIn, stripeAccountEnabled } =
    useLoaderData<typeof loader>();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success") === "true";

  const [modalOpen, setModalOpen] = useState(false);

  const slug = params.slug!;

  return (
    <Flex p={4} flexDir="column" gap={4}>
      {success && (
        <Box
          p={3}
          rounded="xl"
          bgColor="green.900/30"
          borderWidth={1}
          borderColor="green.800"
        >
          <styled.p fontSize="sm" color="green.300" fontWeight="semibold">
            Thank you for your donation!
          </styled.p>
        </Box>
      )}

      {stripeAccountEnabled && isSignedIn && (
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          type="button"
        >
          <RiHeartFill /> Make a Donation
        </Button>
      )}

      {stripeAccountEnabled && !isSignedIn && (
        <styled.p fontSize="sm" color="gray.400">
          Sign in to make a donation.
        </styled.p>
      )}

      {donations.length === 0 ? (
        <styled.p color="gray.400" fontSize="sm">
          No donations yet. Be the first to support this track!
        </styled.p>
      ) : (
        donations.map((donation) => (
          <Box
            key={donation.id}
            p={4}
            rounded="xl"
            borderWidth={1}
            borderColor="gray.800"
            bgColor="gray.900"
          >
            <Flex alignItems="center" gap={3} mb={donation.message ? 3 : 0}>
              {donation.anonymous || !donation.user ? (
                <Box
                  w={10}
                  h={10}
                  rounded="full"
                  bgColor="gray.700"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <RiUserFill size={20} />
                </Box>
              ) : (
                <Link to={`/drivers/${donation.user.driverId}`}>
                  <styled.img
                    src={donation.user.image ?? "/blank-driver-right.jpg"}
                    alt={donation.user.firstName ?? ""}
                    w={10}
                    h={10}
                    rounded="full"
                    objectFit="cover"
                  />
                </Link>
              )}
              <Box flex={1}>
                {donation.anonymous || !donation.user ? (
                  <styled.p fontWeight="semibold" fontSize="sm">
                    Anonymous
                  </styled.p>
                ) : (
                  <Link to={`/drivers/${donation.user.driverId}`}>
                    <styled.p fontWeight="semibold" fontSize="sm">
                      {donation.user.firstName} {donation.user.lastName}
                    </styled.p>
                  </Link>
                )}
                <Flex alignItems="center" gap={2}>
                  <styled.span
                    fontWeight="bold"
                    fontSize="sm"
                    color="green.400"
                  >
                    £{donation.amount.toFixed(2)}
                  </styled.span>
                  <styled.span color="gray.500" fontSize="xs">
                    {formatDistanceToNow(
                      new Date(
                        Math.min(
                          new Date(donation.createdAt).getTime(),
                          Date.now(),
                        ),
                      ),
                      { addSuffix: true },
                    )}
                  </styled.span>
                </Flex>
              </Box>
            </Flex>
            {donation.message && (
              <styled.p fontSize="sm" color="gray.200" whiteSpace="pre-wrap">
                {donation.message}
              </styled.p>
            )}
          </Box>
        ))
      )}

      <DonateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slug={slug}
      />
    </Flex>
  );
};

export default TrackDonationsPage;
