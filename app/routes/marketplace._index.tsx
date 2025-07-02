import type { LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useSearchParams } from "react-router";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSearchLine,
} from "react-icons/ri";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { ProductCard } from "~/components/ProductCard";
import { styled, Box, Flex, Spacer, Center, Grid } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/marketplace._index";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `RC Drift UK | Marketplace`,
      description:
        "We've scraped shops from across the world to bring you a comprehensive parts marketplace.",
      "og:title": "RC Drift UK | Marketplace",
      "og:description":
        "We've scraped shops from across the world to bring you a comprehensive parts marketplace.",
    },
  ];
};

export const loader = async (params: LoaderFunctionArgs) => {
  const url = new URL(params.request.url);
  const query =
    z.string().nullable().parse(url.searchParams.get("query")) ?? "";
  const page = Math.max(
    z.coerce.number().nullable().parse(url.searchParams.get("page")) ?? 1,
    1,
  );

  const search =
    query
      ?.toLowerCase()
      .replace(/reve d|reved/g, "reve")
      .replace(/springs/g, "spring")
      .replace(/wheels/g, "wheel")
      .replace(/yd2|yd-2/g, "yd 2")
      .split(" ") ?? [];

  return prisma.products.findMany({
    ...(query !== null && {
      where: {
        AND:
          search.length > 0
            ? search.map((phrase) => {
                return {
                  title: {
                    contains: phrase,
                    mode: "insensitive",
                  },
                };
              })
            : [],
      },
    }),
    take: 20,
    skip: 20 * (page - 1),
    orderBy: [
      {
        title: "asc",
      },
      {
        shop: "asc",
      },
    ],
    include: {
      Tracks: true,
    },
  });
};

const Page = () => {
  const products = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const page = Math.max(
    z.coerce.number().nullable().parse(searchParams.get("page")) ?? 1,
    1,
  );

  return (
    <>
      <styled.h1 srOnly>Marketplace</styled.h1>

      <Box mt={4}>
        <Form action="/marketplace">
          <Flex rounded="full" p={1} borderWidth={1} borderColor="gray.800">
            <Center pl={4} color="gray.500">
              <RiSearchLine />
            </Center>
            <styled.input
              name="query"
              defaultValue={query ?? ""}
              bgColor="inherit"
              px={4}
              py={2}
              w="full"
              placeholder="What are you looking for?"
              color="inherit"
              outline="none"
            />
            <Button type="submit" variant="secondary">
              Go
            </Button>
          </Flex>
        </Form>
      </Box>

      {products.length <= 0 && (
        <styled.p fontWeight="extrabold" fontSize="3xl" my={8}>
          No Results Found...
        </styled.p>
      )}

      <Grid
        gridTemplateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={4}
        mt={4}
      >
        {products.map((product) => {
          return <ProductCard product={product} key={product.slug} />;
        })}
      </Grid>

      <Flex pt={6}>
        {page > 1 && (
          <LinkButton
            to={`/marketplace?query=${query}&page=${page - 1}`}
            variant="secondary"
          >
            <RiArrowLeftSLine /> Previous
          </LinkButton>
        )}

        <Spacer />

        {products.length >= 20 && (
          <LinkButton
            to={`/marketplace?query=${query}&page=${page + 1}`}
            variant="secondary"
          >
            Next <RiArrowRightSLine />
          </LinkButton>
        )}
      </Flex>
    </>
  );
};

export default Page;
