import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { ProductCard } from "~/components/ProductCard";
import { Flex, Grid, Spacer, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params, request } = args;
  const slug = z.string().parse(params.slug);
  const url = new URL(request.url);
  const page = z.coerce.number().parse(url.searchParams.get("page") ?? "1");

  const products = await prisma.products.findMany({
    where: {
      Tracks: {
        slug,
      },
    },
    take: 21,
    skip: (page - 1) * 21,
    orderBy: {
      title: "asc",
    },
    include: {
      Tracks: true,
    },
  });

  return { products, page, slug };
};

const TrackProductsPage = () => {
  const { products, page, slug } = useLoaderData<typeof loader>();

  return (
    <>
      <Grid
        gridTemplateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
        gap={2}
        p={4}
      >
        {products.length <= 0 && <styled.p>No products here yet...</styled.p>}

        {products.map((product) => (
          <ProductCard product={product} key={product.slug} />
        ))}
      </Grid>
      <Flex p={4} borderTopWidth={1} borderColor="gray.800">
        {page > 1 && (
          <LinkButton
            to={`/tracks/${slug}/products?page=${page - 1}`}
            variant="secondary"
            data-replace="true"
            replace
          >
            <RiArrowLeftSLine /> Previous
          </LinkButton>
        )}

        <Spacer />

        {products.length >= 21 && (
          <LinkButton
            to={`/tracks/${slug}/products?page=${page + 1}`}
            variant="secondary"
            data-replace="true"
            replace
          >
            Next <RiArrowRightSLine />
          </LinkButton>
        )}
      </Flex>
    </>
  );
};

export default TrackProductsPage;
