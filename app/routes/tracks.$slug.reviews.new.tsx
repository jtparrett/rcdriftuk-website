import { useFormik } from "formik";
import { RiSendPlaneFill } from "react-icons/ri";
import {
  redirect,
  useLoaderData,
  useNavigate,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "~/components/Button";
import { StarRating } from "~/components/StarRating";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

const reviewSchema = z.object({
  stars: z.number().int().min(1).max(5),
  content: z.string().min(1),
});

const validationSchema = toFormikValidationSchema(reviewSchema);

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect(`/sign-in?redirect_url=/tracks/${slug}/reviews/new`);
  }

  const user = await getUser(userId);
  notFoundInvariant(user, "User not found");

  const track = await prisma.tracks.findFirst({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
  notFoundInvariant(track, "Track not found");

  const existingReview = await prisma.trackReviews.findFirst({
    where: { trackId: track.id, userId },
    select: { id: true },
  });

  if (existingReview) {
    throw redirect(`/tracks/${slug}/reviews`);
  }

  return { user, track };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "You must be signed in");

  const track = await prisma.tracks.findFirst({
    where: { slug },
    select: { id: true },
  });
  notFoundInvariant(track, "Track not found");

  const formData = await request.json();
  const data = reviewSchema.parse(formData);

  await prisma.trackReviews.create({
    data: {
      stars: data.stars,
      content: data.content,
      trackId: track.id,
      userId,
    },
  });

  return redirect(`/tracks/${slug}/reviews`);
};

const NewReviewPage = () => {
  const submit = useSubmit();
  const navigate = useNavigate();
  const { user, track } = useLoaderData<typeof loader>();

  const formik = useFormik({
    initialValues: {
      stars: 0,
      content: "",
    },
    validationSchema,
    async onSubmit(values) {
      await submit(JSON.stringify(values), {
        method: "POST",
        encType: "application/json",
      });
    },
  });

  return (
    <Box p={4}>
      <styled.h2 fontSize="lg" fontWeight="bold" mb={4}>
        Review {track.name}
      </styled.h2>

      <Box
        bgColor="gray.900"
        rounded="2xl"
        py={4}
        px={4}
        borderWidth={1}
        borderColor="gray.800"
      >
        <Flex gap={2} alignItems="center" mb={4}>
          <styled.img
            src={user.image ?? "/blank-driver-right.jpg"}
            alt={user.firstName ?? ""}
            w={10}
            h={10}
            rounded="full"
            objectFit="cover"
          />
          <styled.p fontWeight="medium">
            {user.firstName} {user.lastName}
          </styled.p>
        </Flex>

        <form onSubmit={formik.handleSubmit}>
          <Box mb={4}>
            <styled.label
              display="block"
              fontSize="sm"
              fontWeight="medium"
              color="gray.400"
              mb={1}
            >
              Rating
            </styled.label>
            <StarRating
              value={formik.values.stars}
              onChange={(value) => formik.setFieldValue("stars", value)}
              size="lg"
              interactive
            />
          </Box>

          <Box mb={4}>
            <styled.label
              display="block"
              fontSize="sm"
              fontWeight="medium"
              color="gray.400"
              mb={1}
            >
              Review
            </styled.label>
            <styled.textarea
              name="content"
              placeholder="Share your experience..."
              value={formik.values.content}
              onChange={formik.handleChange}
              w="full"
              minH={120}
              p={3}
              rounded="xl"
              bgColor="gray.800"
              borderWidth={1}
              borderColor="gray.700"
              color="white"
              fontSize="sm"
              resize="vertical"
              _focus={{
                outline: "none",
                borderColor: "brand.500",
              }}
            />
          </Box>

          <Flex justifyContent="flex-end" gap={2}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/tracks/${track.slug}/reviews`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={formik.isSubmitting}
              disabled={formik.isSubmitting || !formik.isValid || formik.values.stars === 0}
            >
              Submit Review <RiSendPlaneFill />
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
};

export default NewReviewPage;
