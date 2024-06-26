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
            <styled.p
              color="gray.400"
              fontSize="sm"
              whiteSpace="pre-line"
              mb={2}
            >
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
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
