import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { useCallback, useState } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSearchLine,
} from "react-icons/ri";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { ProductCard } from "~/components/ProductCard";
import {
  styled,
  Flex,
  Spacer,
  Center,
  Grid,
  Container,
  Box,
} from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/marketplace._index";
import { AppName, Regions } from "~/utils/enums";
import { TabsBar } from "~/components/TabsBar";
import { Tab, TabButton } from "~/components/Tab";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `${AppName} | Marketplace`,
    },
    {
      description:
        "We've scraped shops from across the world to bring you a comprehensive parts marketplace.",
    },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
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

  const region = z
    .nativeEnum(Regions)
    .default(Regions.ALL)
    .parse(url.searchParams.get("region")?.toUpperCase());

  const search =
    query
      ?.toLowerCase()
      .replace(/reve d|reved/g, "reve")
      .replace(/springs/g, "spring")
      .replace(/wheels/g, "wheel")
      .replace(/yd2|yd-2/g, "yd 2")
      .split(" ") ?? [];

  const products = await prisma.products.findMany({
    ...(query !== null && {
      where: {
        Tracks: {
          ...(region !== Regions.ALL ? { region } : {}),
        },
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
    ],
    include: {
      Tracks: true,
    },
  });

  return { products, region };
};

const Page = () => {
  const { products, region } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const [searchValue, setSearchValue] = useState(query);
  const page = Math.max(
    z.coerce.number().nullable().parse(searchParams.get("page")) ?? 1,
    1,
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams);
          if (value.trim()) {
            newSearchParams.set("query", value.trim());
          } else {
            newSearchParams.delete("query");
          }
          // Reset to page 1 when searching
          newSearchParams.delete("page");
          setSearchParams(newSearchParams);
        }, 300); // 300ms debounce
      };
    })(),
    [searchParams, setSearchParams],
  );

  // Handle input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const changeRegion = (region: Regions) => {
    setSearchParams((prev) => {
      prev.set("region", region.toLowerCase());
      return prev;
    });
  };

  return (
    <>
      <styled.h1 srOnly>Marketplace</styled.h1>

      <TabsBar>
        {Object.values(Regions).map((option) => {
          return (
            <TabButton
              key={option}
              onClick={() => changeRegion(option)}
              isActive={option === region}
            >
              {option}
            </TabButton>
          );
        })}
      </TabsBar>

      <Box borderBottomWidth={1} borderColor="gray.900">
        <Flex maxW={1100} mx="auto">
          <Center pl={4} color="gray.500">
            <RiSearchLine />
          </Center>
          <styled.input
            value={searchValue}
            onChange={handleSearchChange}
            bgColor="inherit"
            px={2}
            py={3}
            w="full"
            placeholder="Search marketplace..."
            color="inherit"
            outline="none"
          />
        </Flex>
      </Box>

      <Container maxW={1100} px={2} py={4}>
        {products.length <= 0 && (
          <styled.p fontWeight="medium" textAlign="center">
            No results were found for this search...
          </styled.p>
        )}

        <Grid
          gridTemplateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
          gap={4}
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
              replace
              data-replace="true"
            >
              <RiArrowLeftSLine /> Previous
            </LinkButton>
          )}

          <Spacer />

          {products.length >= 20 && (
            <LinkButton
              to={`/marketplace?query=${query}&page=${page + 1}`}
              variant="secondary"
              replace
              data-replace="true"
            >
              Next <RiArrowRightSLine />
            </LinkButton>
          )}
        </Flex>
      </Container>
    </>
  );
};

export default Page;
