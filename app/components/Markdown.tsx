import { RiLink } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { styled } from "~/styled-system/jsx";
import rehypeRaw from "rehype-raw";

interface Props {
  children?: string | null;
}

export const Markdown = ({ children }: Props) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        p({ children }) {
          return (
            <styled.p color="gray.300" whiteSpace="pre-line" mb={4}>
              {children}
            </styled.p>
          );
        },
        a({ children, href }) {
          return (
            <styled.a
              display="inline-flex"
              flexWrap="wrap"
              gap={1}
              alignItems="center"
              color="brand.500"
              href={href}
              target="_blank"
              fontWeight="medium"
            >
              {children}
              <RiLink />
            </styled.a>
          );
        },
        hr() {
          return <styled.hr borderColor="gray.800" my={6} />;
        },
        h1({ children }) {
          return (
            <styled.h1 fontSize="2xl" fontWeight="bold" mb={2} mt={8}>
              {children}
            </styled.h1>
          );
        },
        h2({ children }) {
          return (
            <styled.h2 fontSize="xl" fontWeight="bold" mb={2} mt={8}>
              {children}
            </styled.h2>
          );
        },
        h3({ children }) {
          return (
            <styled.h3 fontSize="lg" fontWeight="bold" mb={2} mt={8}>
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
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
