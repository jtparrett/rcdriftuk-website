import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiMapPinLine,
  RiSearchLine,
} from "react-icons/ri";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { LinkOverlay } from "~/components/LinkOverlay";
import { ProductStatus } from "~/components/ProductStatus";
import {
  styled,
  Box,
  Flex,
  Spacer,
  Center,
  AspectRatio,
} from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
  return [
    {
      title: `RC Drift UK | Catalogue`,
      description:
        "We've scraped shops from across the UK to bring you a comprehensive parts catalogue.",
      "og:title": "RC Drift UK | Catalogue",
      "og:description":
        "We've scraped shops from across the UK to bring you a comprehensive parts catalogue.",
    },
  ];
};

export const loader = async (params: LoaderFunctionArgs) => {
  const url = new URL(params.request.url);
  const query =
    z.string().nullable().parse(url.searchParams.get("query")) ?? "";
  const page = Math.max(
    z.coerce.number().nullable().parse(url.searchParams.get("page")) ?? 1,
    1
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
        shop: "desc",
      },
      {
        title: "asc",
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
    1
  );

  return (
    <>
      <styled.h1 srOnly>Catalogue</styled.h1>

      <Box mt={4}>
        <Form action="/catalogue">
          <Flex rounded="xl" p={1} borderWidth={1} borderColor="gray.800">
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
            <Button type="submit">Go</Button>
          </Flex>
        </Form>
      </Box>

      {products.length <= 0 && (
        <styled.p fontWeight="extrabold" fontSize="3xl" my={8}>
          No Results Found...
        </styled.p>
      )}

      <Flex flexWrap="wrap" ml={-4}>
        {products.map((product) => {
          return (
            <styled.article
              key={product.slug}
              w={{ base: "50%", md: "25%" }}
              pt={4}
              pl={4}
              pb={4}
              pos="relative"
            >
              <Box pos="relative">
                <Box pos="absolute" top={2} right={2} zIndex={1}>
                  <ProductStatus status={product.status} />
                </Box>

                <AspectRatio
                  w="full"
                  ratio={1.2}
                  pos="relative"
                  overflow="hidden"
                  rounded="md"
                  mb={4}
                >
                  <styled.img
                    src={product.image}
                    w="full"
                    pos="absolute"
                    inset={0}
                  />
                </AspectRatio>
              </Box>
              <LinkOverlay to={`/catalogue/${product.slug}`}>
                <Flex alignItems="flex-start" gap={4}>
                  <Box w={12} h={12} rounded="full" overflow="hidden">
                    <styled.img
                      src={product.Tracks?.image ?? ""}
                      w="full"
                      h="full"
                      objectFit="cover"
                      display="block"
                    />
                  </Box>
                  <Box flex={1}>
                    <styled.h1 fontWeight="semibold" mb={1} textWrap="balance">
                      {product.title}
                    </styled.h1>
                    <Flex alignItems="center" gap={1} color="gray.400">
                      <styled.p fontSize="sm">{product.Tracks?.name}</styled.p>
                      <styled.span fontSize="sm">
                        <RiMapPinLine />
                      </styled.span>
                    </Flex>
                  </Box>
                </Flex>
              </LinkOverlay>
            </styled.article>
          );
        })}
      </Flex>

      <Flex pt={6}>
        {page > 1 && (
          <LinkButton
            to={`/catalogue?query=${query}&page=${page - 1}`}
            variant="secondary"
          >
            <RiArrowLeftSLine /> Previous
          </LinkButton>
        )}

        <Spacer />

        {products.length >= 20 && (
          <LinkButton
            to={`/catalogue?query=${query}&page=${page + 1}`}
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
