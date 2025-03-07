import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import invariant from "tiny-invariant";

invariant(process.env.SHOPIFY_STORE_URL, "SHOPIFY_STORE_URL is not set");
invariant(
  process.env.SHOPIFY_STOREFRONT_TOKEN,
  "SHOPIFY_STOREFRONT_TOKEN is not set"
);

export const shopify = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_URL,
  apiVersion: "2024-04",
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
});
