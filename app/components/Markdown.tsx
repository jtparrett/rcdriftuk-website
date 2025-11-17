import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Flex, styled } from "~/styled-system/jsx";
import rehypeRaw from "rehype-raw";
import { Link } from "react-router";
import { css } from "~/styled-system/css";

interface Props {
  children?: string | null;
}

const processUserMentions = (text: string): string => {
  if (!text) return text;

  // Replace @userid(firstname lastname) with [firstname lastname](/drivers/userid)
  return text.replace(/@(\d+)\(([^)]+)\)/g, "[$2](/drivers/$1)");
};

export const Markdown = ({ children }: Props) => {
  const processedContent = processUserMentions(children || "");

  return (
    <Flex flexDir="column" gap={4}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        allowedElements={[
          "p",
          "a",
          "b",
          "strong",
          "h1",
          "h2",
          "h3",
          "ul",
          "ol",
          "li",
          "blockquote",
          "hr",
          "em",
          "code",
          "pre",
          "img",
        ]}
        components={{
          p({ children }) {
            return (
              <styled.p color="gray.300" whiteSpace="pre-line">
                {children}
              </styled.p>
            );
          },
          a({ children, href }) {
            // Check if this is an internal link (starts with /)
            if (href?.startsWith("/")) {
              return (
                <Link
                  to={href}
                  className={css({
                    color: "brand.500",
                  })}
                >
                  {children}
                </Link>
              );
            }

            return (
              <styled.a color="brand.500" href={href} target="_blank">
                {children}
              </styled.a>
            );
          },
          hr() {
            return <styled.hr borderColor="gray.800" my={6} />;
          },
          h1({ children }) {
            return (
              <styled.h1 fontSize="2xl" fontWeight="bold" mt={8}>
                {children}
              </styled.h1>
            );
          },
          h2({ children }) {
            return (
              <styled.h2 fontSize="xl" fontWeight="bold" mt={8}>
                {children}
              </styled.h2>
            );
          },
          h3({ children }) {
            return (
              <styled.h3 fontSize="lg" fontWeight="bold" mt={8}>
                {children}
              </styled.h3>
            );
          },
          ul({ children }) {
            return (
              <styled.ul color="gray.300" whiteSpace="pre-line" lineHeight={1}>
                {children}
              </styled.ul>
            );
          },
          li({ children }) {
            return (
              <styled.li
                color="gray.300"
                lineHeight={1.5}
                _before={{
                  content: '""',
                  display: "inline-block",
                  width: 1,
                  height: 1,
                  bgColor: "gray.500",
                  borderRadius: "full",
                  verticalAlign: "middle",
                  mr: 2,
                }}
              >
                {children}
              </styled.li>
            );
          },
          blockquote({ children }) {
            return (
              <styled.blockquote
                color="gray.300"
                whiteSpace="pre-line"
                borderLeftWidth={4}
                borderLeftColor="gray.800"
                pl={6}
                mb={4}
              >
                {children}
              </styled.blockquote>
            );
          },
          em({ children }) {
            return (
              <styled.em color="gray.300" fontStyle="italic">
                {children}
              </styled.em>
            );
          },
          code({ children }) {
            return (
              <styled.code
                color="brand.400"
                bg="gray.900"
                px={1}
                py={0.5}
                borderRadius="sm"
                fontSize="sm"
                fontFamily="mono"
              >
                {children}
              </styled.code>
            );
          },
          pre({ children }) {
            return (
              <styled.pre
                bg="gray.900"
                p={4}
                borderRadius="md"
                overflow="auto"
                fontSize="sm"
                fontFamily="mono"
                border="1px solid"
                borderColor="gray.800"
                my={4}
              >
                {children}
              </styled.pre>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </Flex>
  );
};
