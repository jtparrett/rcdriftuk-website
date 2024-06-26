import { Flex, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { RiHomeFill } from "react-icons/ri";
import { Fragment } from "react";

interface Props {
  paths: { to: string; title: string }[];
}

export const Breadcrumbs = ({ paths }: Props) => {
  return (
    <Flex alignItems="center" mt={{ base: 0, md: 4 }} mb={2}>
      <LinkButton to="/" variant="ghost" px={2} py={2}>
        <RiHomeFill />
      </LinkButton>

      <styled.span color="brand.500" px={1}>
        //
      </styled.span>

      {paths.map((path, i) => (
        <Fragment key={i}>
          <LinkButton to={path.to} variant="ghost" px={2} py={1}>
            {path.title}
          </LinkButton>

          {i < paths.length - 1 && (
            <styled.span color="brand.500" px={1}>
              //
            </styled.span>
          )}
        </Fragment>
      ))}
    </Flex>
  );
};
