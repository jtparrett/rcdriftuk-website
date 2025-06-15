import { format } from "date-fns";
import { RiArrowRightLine, RiCalendarLine } from "react-icons/ri";
import { useLoaderData, type MetaFunction } from "react-router";
import { LinkButton } from "~/components/Button";
import { Markdown } from "~/components/Markdown";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | Insights Blog" },
    {
      name: "description",
      content: "RC Drift UK's Insights Blog.",
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
      <ul>
        {articles.map((article) => (
          <Card key={article.id}>
            <styled.h2 srOnly>{article.title}</styled.h2>
            <styled.img src={article.image} alt={article.title} />

            <Box borderTopWidth={1} borderColor="gray.800" p={8}>
              <Markdown>{article.content.split("\n")[0] + "..."}</Markdown>

              <Flex
                gap={3}
                alignItems={{ base: "flex-start", md: "center" }}
                flexDir={{ base: "column", md: "row" }}
              >
                <Spacer />
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
                <LinkButton to={`/blog/${article.slug}`}>
                  Read the full article <RiArrowRightLine />
                </LinkButton>
              </Flex>
            </Box>
          </Card>
        ))}
      </ul>
    </Container>
  );
};

export default BlogListingPage;
