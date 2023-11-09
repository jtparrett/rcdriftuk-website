import contentful from "contentful";

export const client = contentful.createClient({
  space: "nkbaksxyiny2",
  environment: "master",
  accessToken: process.env.CONTENTFUL_ACCESS ?? "",
});
