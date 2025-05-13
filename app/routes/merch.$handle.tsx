import { Form, redirect, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { styled, Box, Flex, Container } from "~/styled-system/jsx";
import { Button, LinkButton } from "~/components/Button";
import { useState } from "react";
import { z } from "zod";
import { shopify } from "~/utils/shopify.server";
import { Select } from "~/components/Select";
import { RiArrowLeftLine } from "react-icons/ri";
import type { Route } from "./+types/merch.$handle";

const CartCreateResponseSchema = z.object({
  data: z.object({
    cartCreate: z.object({
      cart: z.object({
        id: z.string(),
        checkoutUrl: z.string(),
        lines: z.object({
          edges: z.array(
            z.object({
              node: z.object({
                id: z.string(),
              }),
            }),
          ),
        }),
      }),
      userErrors: z.array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      ),
    }),
  }),
});

const CartLinesAddResponseSchema = z.object({
  data: z.object({
    cartLinesAdd: z.object({
      cart: z.object({
        id: z.string(),
        checkoutUrl: z.string(),
        lines: z.object({
          edges: z.array(
            z.object({
              node: z.object({
                id: z.string(),
              }),
            }),
          ),
        }),
      }),
      userErrors: z.array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      ),
    }),
  }),
});

const CartQueryResponseSchema = z.object({
  data: z.object({
    cart: z.object({
      id: z.string(),
      checkoutUrl: z.string(),
      lines: z.object({
        edges: z.array(
          z.object({
            node: z.object({
              id: z.string(),
            }),
          }),
        ),
      }),
    }),
  }),
});

const ProductResponseSchema = z.object({
  data: z.object({
    product: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      images: z.object({
        edges: z.array(
          z.object({
            node: z.object({
              url: z.string(),
            }),
          }),
        ),
      }),
      variants: z.object({
        edges: z.array(
          z.object({
            node: z.object({
              id: z.string(),
              title: z.string(),
              price: z.object({
                amount: z.string(),
              }),
            }),
          }),
        ),
      }),
    }),
  }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { handle } = params;
  if (!handle) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  try {
    const data = await shopify.request(
      `
      query getProduct($handle: String!) {
        product(handle: $handle) {
          id
          title
          description
          images(first: 3) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                }
              }
            }
          }
        }
      }
    `,
      {
        variables: {
          handle,
        },
      },
    );

    const validatedData = ProductResponseSchema.parse(data);
    const product = validatedData.data.product;

    return { product };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Response(null, {
      status: 404,
      statusText: "Product not found",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const variantId = formData.get("variantId");

  try {
    // Create a new cart
    const cartData = await shopify.request(`
      mutation CreateCart {
        cartCreate {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    const validatedCartData = CartCreateResponseSchema.parse(cartData);

    if (validatedCartData.data.cartCreate.userErrors.length > 0) {
      throw new Error(validatedCartData.data.cartCreate.userErrors[0].message);
    }

    const cartId = validatedCartData.data.cartCreate.cart.id;

    // Add item to cart
    const addToCartData = await shopify.request(
      `
      mutation AddToCart($cartId: ID!, $variantId: ID!) {
        cartLinesAdd(
          cartId: $cartId,
          lines: [
            {
              merchandiseId: $variantId,
              quantity: 1
            }
          ]
        ) {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
      {
        variables: {
          cartId,
          variantId,
        },
      },
    );

    const validatedAddToCartData =
      CartLinesAddResponseSchema.parse(addToCartData);

    if (validatedAddToCartData.data.cartLinesAdd.userErrors.length > 0) {
      throw new Error(
        validatedAddToCartData.data.cartLinesAdd.userErrors[0].message,
      );
    }

    // Get checkout URL
    const checkoutData = await shopify.request(
      `
      query GetCart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
          lines(first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `,
      {
        variables: {
          cartId,
        },
      },
    );

    const validatedCheckoutData = CartQueryResponseSchema.parse(checkoutData);

    return redirect(validatedCheckoutData.data.cart.checkoutUrl);
  } catch (error) {
    console.error("Error creating cart and checkout:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout" }),
      {
        status: 500,
      },
    );
  }
};

export const meta: Route.MetaFunction = ({ data }) => {
  const { product } = data ?? {};
  return [
    { title: `RC Drift UK | Merch | ${product?.title}` },
    { description: product?.description },
  ];
};

const MerchDetailPage = () => {
  const { product } = useLoaderData<typeof loader>();
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants.edges[0].node.id,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedVariant = product.variants.edges.find(
    (variant) => variant.node.id === selectedVariantId,
  );

  const selectedImage = product.images.edges[selectedImageIndex];

  return (
    <Container maxW={900} px={2} py={6}>
      <Flex flexDir={{ base: "column", md: "row" }} gap={4}>
        <Box flex={1}>
          <Box rounded="lg" overflow="hidden" bgColor="white" w="full">
            <styled.img
              src={selectedImage.node.url}
              w="80%"
              mx="auto"
              display="block"
              alt={product.title}
              key={selectedImage.node.url}
            />
          </Box>

          {product.images.edges.length > 1 && (
            <Flex gap={2} mt={2} flexWrap="wrap">
              {product.images.edges.map((image, index) => (
                <Box
                  key={image.node.url}
                  bgColor="white"
                  w="calc(33.33333333% - var(--spacing-2))"
                  rounded="lg"
                  overflow="hidden"
                  flex="none"
                >
                  <styled.img
                    src={image.node.url}
                    w="full"
                    display="block"
                    alt={product.title}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                </Box>
              ))}
            </Flex>
          )}
        </Box>
        <Box flex={1} bgColor="gray.900" rounded="lg" px={7} py={4}>
          <LinkButton to="/merch" variant="ghost" px={0}>
            <RiArrowLeftLine />
            Return to Merch
          </LinkButton>

          <styled.h1
            fontWeight="extrabold"
            fontSize="3xl"
            lineHeight={1.1}
            mt={4}
            textWrap="balance"
          >
            {product.title}
          </styled.h1>

          {selectedVariant && (
            <styled.p fontSize="xl" fontWeight="bold" mb={6}>
              &pound;{parseFloat(selectedVariant.node.price.amount).toFixed(2)}
            </styled.p>
          )}

          {product.description && (
            <styled.p
              fontSize="sm"
              mb={6}
              whiteSpace="pre-line"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <Box mb={6}>
            <styled.label display="block" mb={1} fontWeight="medium">
              Select a size
            </styled.label>
            <Select
              value={selectedVariantId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedVariantId(e.target.value)
              }
            >
              <option value="">Choose a size</option>
              {product.variants.edges.map((variant) => (
                <option key={variant.node.id} value={variant.node.id}>
                  {variant.node.title}
                </option>
              ))}
            </Select>
          </Box>

          <Form method="post">
            <input type="hidden" name="variantId" value={selectedVariantId} />
            <Button type="submit" w="full" variant="primary">
              Buy Now
            </Button>
          </Form>
        </Box>
      </Flex>
    </Container>
  );
};

export default MerchDetailPage;
