import { format } from "date-fns";
import { RiCalendarLine } from "react-icons/ri";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Markdown } from "~/components/Markdown";
import { Box, Container, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/blog.$slug";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) {
    return [
      { title: `${AppName} | Insights Blog` },
      { name: "description", content: `${AppName} Insights Blog.` },
      {
        property: "og:image",
        content: "https://rcdrift.io/og-image.jpg",
      },
    ];
  }

  const intro = data.content.split("\n")[0] + "...";

  return [
    { title: `${AppName} | ${data.title}` },
    {
      name: "description",
      content: intro,
    },
    {
      name: "og:title",
      content: data.title,
    },
    {
      name: "og:description",
      content: intro,
    },
    {
      property: "og:image",
      content: data.image,
    },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params;

  const article = await prisma.articles.findFirst({
    where: { slug },
  });

  if (!article) {
    throw new Response("Not Found", { status: 404 });
  }

  return article;
};

const BlogPostPage = () => {
  const article = useLoaderData<typeof loader>();

  return (
    <Container maxW={780} px={4} py={8}>
      <Box
        borderRadius="2xl"
        mb={4}
        borderWidth={1}
        borderColor="gray.800"
        overflow="hidden"
      >
        <styled.img src={article.image} alt={article.title} />
      </Box>
      <styled.h1 srOnly>{article.title}</styled.h1>
      <styled.p
        fontSize="sm"
        color="gray.500"
        borderWidth={1}
        borderColor="gray.800"
        px={3}
        py={1}
        rounded="full"
        display="inline-flex"
        alignItems="center"
        gap={1.5}
        mb={4}
      >
        {format(article.createdAt, "do MMMM yyyy")}
        <RiCalendarLine />
      </styled.p>
      <Markdown>{article.content}</Markdown>
    </Container>
  );
};

export default BlogPostPage;
