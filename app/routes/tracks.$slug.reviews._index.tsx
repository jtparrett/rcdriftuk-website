import { formatDistanceToNow } from "date-fns";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { StarRating } from "~/components/StarRating";
import { LinkButton } from "~/components/Button";
import { RiStarFill } from "react-icons/ri";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);

  const track = await prisma.tracks.findFirst({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (!track) throw new Response("Track not found", { status: 404 });

  const reviews = await prisma.trackReviews.findMany({
    where: { trackId: track.id },
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

  let hasReviewed = false;
  if (userId) {
    const existing = await prisma.trackReviews.findFirst({
      where: { trackId: track.id, userId },
      select: { id: true },
    });
    hasReviewed = !!existing;
  }

  const averageStars =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
      : 0;

  return {
    reviews,
    averageStars,
    reviewCount: reviews.length,
    hasReviewed,
    isSignedIn: !!userId,
    trackSlug: track.slug,
  };
};

const TrackReviewsPage = () => {
  const { reviews, averageStars, reviewCount, hasReviewed, isSignedIn, trackSlug } =
    useLoaderData<typeof loader>();

  return (
    <Flex p={4} flexDir="column" gap={4}>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap={3}
        flexWrap="wrap"
      >
        <Flex alignItems="center" gap={3}>
          {reviewCount > 0 ? (
            <>
              <Flex alignItems="baseline" gap={1.5}>
                <styled.span fontSize="3xl" fontWeight="bold" lineHeight={1}>
                  {averageStars.toFixed(1)}
                </styled.span>
                <RiStarFill color="#eab308" size={20} />
              </Flex>
              <styled.span color="gray.400" fontSize="sm">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </styled.span>
            </>
          ) : (
            <styled.span color="gray.400" fontSize="sm">
              No reviews yet
            </styled.span>
          )}
        </Flex>

        {isSignedIn && !hasReviewed && (
          <LinkButton
            to={`/tracks/${trackSlug}/reviews/new`}
            size="sm"
          >
            Write a Review
          </LinkButton>
        )}
      </Flex>

      {reviews.map((review) => (
        <Box
          key={review.id}
          p={4}
          rounded="xl"
          borderWidth={1}
          borderColor="gray.800"
          bgColor="gray.900"
        >
          <Flex alignItems="center" gap={3} mb={3}>
            <Link to={`/drivers/${review.user.driverId}`}>
              <styled.img
                src={review.user.image ?? "/blank-driver-right.jpg"}
                alt={review.user.firstName ?? ""}
                w={10}
                h={10}
                rounded="full"
                objectFit="cover"
              />
            </Link>
            <Box flex={1}>
              <Link to={`/drivers/${review.user.driverId}`}>
                <styled.p fontWeight="semibold" fontSize="sm">
                  {review.user.firstName} {review.user.lastName}
                </styled.p>
              </Link>
              <Flex alignItems="center" gap={2}>
                <StarRating value={review.stars} size="sm" />
                <styled.span color="gray.500" fontSize="xs">
                  {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                </styled.span>
              </Flex>
            </Box>
          </Flex>
          <styled.p fontSize="sm" color="gray.200" whiteSpace="pre-wrap">
            {review.content}
          </styled.p>
        </Box>
      ))}
    </Flex>
  );
};

export default TrackReviewsPage;
