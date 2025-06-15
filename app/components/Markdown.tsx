import { RiLink } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import { styled } from "~/styled-system/jsx";

interface Props {
  children?: string | null;
}

export const Markdown = ({ children }: Props) => {
  return (
    <ReactMarkdown
      components={{
        p({ children }) {
          return (
            <styled.p color="gray.400" whiteSpace="pre-line" mb={4}>
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
              fontWeight="semibold"
            >
              {children}
              <RiLink />
            </styled.a>
          );
        },
        hr({ children }) {
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
            <styled.ul color="gray.400" whiteSpace="pre-line" lineHeight={1}>
              {children}
            </styled.ul>
          );
        },
        li({ children }) {
          return (
            <styled.li
              color="gray.400"
              _before={{
                content: '""',
                display: "inline-block",
                width: 2,
                height: 2,
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
              color="gray.400"
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
