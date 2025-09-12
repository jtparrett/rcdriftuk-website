import { format } from "date-fns";
import { RiArrowRightLine, RiCalendarLine } from "react-icons/ri";
import { useLoaderData, type MetaFunction } from "react-router";
import { LinkButton } from "~/components/Button";
import { Markdown } from "~/components/Markdown";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { AppName } from "~/utils/enums";

export const meta: MetaFunction = () => {
  return [
    { title: `${AppName} | Insights Blog` },
    {
      name: "description",
      content: `${AppName} Insights Blog.`,
    },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const loader = async () => {
  const articles = await prisma.articles.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return articles;
};

const Card = styled("article", {
  base: {
    borderRadius: "2xl",
    bgColor: "gray.900",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "gray.800",
  },
});

const BlogListingPage = () => {
  const articles = useLoaderData<typeof loader>();

  return (
    <Container maxW={780} px={4} py={8}>
      <styled.h1 fontSize={40} fontWeight={700} mb={4}>
        Insights Blog
      </styled.h1>
      <Flex flexDir="column" gap={4}>
        {articles.map((article) => (
          <Card key={article.id}>
            <styled.h2 srOnly>{article.title}</styled.h2>
            <styled.img src={article.image} alt={article.title} />

            <Box borderTopWidth={1} borderColor="gray.800" p={8}>
              <Markdown>{article.content.split("\n")[0] + "..."}</Markdown>

              <Flex gap={3} flexDir={{ base: "column", md: "row" }} mt={4}>
                <LinkButton to={`/blog/${article.slug}`}>
                  Read the full article <RiArrowRightLine />
                </LinkButton>
                <styled.p
                  fontSize="sm"
                  color="gray.500"
                  borderWidth={1}
                  borderColor="gray.800"
                  px={3}
                  py={1}
                  rounded="full"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  {format(article.createdAt, "do MMMM yyyy")}
                  <RiCalendarLine />
                </styled.p>
              </Flex>
            </Box>
          </Card>
        ))}
      </Flex>
    </Container>
  );
};

export default BlogListingPage;
