import { styled, Container } from "~/styled-system/jsx";
import { Link, useLoaderData } from "react-router";
import { z } from "zod";
import { shopify } from "~/utils/shopify.server";
import type { Route } from "./+types/merch._index";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | Merch` },
    { description: `${AppName} Merch Store` },
  ];
};

const ProductResponseSchema = z.object({
  data: z.object({
    products: z.object({
      edges: z.array(
        z.object({
          node: z.object({
            id: z.string(),
            title: z.string(),
            handle: z.string(),
            images: z.object({
              edges: z.array(
                z.object({
                  node: z.object({
                    url: z.string(),
                  }),
                }),
              ),
            }),
            priceRange: z.object({
              minVariantPrice: z.object({
                amount: z.string(),
              }),
            }),
          }),
        }),
      ),
    }),
  }),
});

export const loader = async () => {
  try {
    const data = await shopify.request(`
      query {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                }
              }
            }
          }
        }
      }
    `);

    const validatedData = ProductResponseSchema.parse(data);

    const products = validatedData.data.products.edges.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      images: edge.node.images.edges.map((imageEdge) => ({
        url: imageEdge.node.url,
      })),
      priceRange: {
        minVariantPrice: {
          amount: edge.node.priceRange.minVariantPrice.amount,
        },
      },
    }));

    return {
      products,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [] };
  }
};

const MerchPage = () => {
  const { products } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2} py={6}>
      <styled.h1 fontWeight="extrabold" fontSize="3xl" mb={4}>
        Merch Store
      </styled.h1>
      {products.length === 0 ? (
        <styled.p>No products available</styled.p>
      ) : (
        <styled.div
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))"
          gap={4}
        >
          {products.map((product) => (
            <Link to={`/merch/${product.handle}`} key={product.id}>
              <styled.div p={4} borderRadius="lg" bgColor="gray.900">
                <styled.img
                  src={product.images[0]?.url}
                  alt={product.title}
                  w="full"
                  h="auto"
                />
                <styled.h2 fontSize="sm">{product.title}</styled.h2>
                <styled.p fontSize="xs" color="gray.500">
                  &pound;
                  {parseFloat(
                    product.priceRange.minVariantPrice.amount,
                  ).toFixed(2)}
                </styled.p>
              </styled.div>
            </Link>
          ))}
        </styled.div>
      )}
    </Container>
  );
};

export default MerchPage;
