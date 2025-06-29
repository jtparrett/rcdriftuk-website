import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { ProductCard } from "~/components/ProductCard";
import { Grid, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);

  const products = await prisma.products.findMany({
    where: {
      Tracks: {
        slug,
      },
    },
    take: 21,
    orderBy: {
      title: "asc",
    },
    include: {
      Tracks: true,
    },
  });

  return products;
};

const TrackProductsPage = () => {
  const products = useLoaderData<typeof loader>();

  return (
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
  );
};

export default TrackProductsPage;
