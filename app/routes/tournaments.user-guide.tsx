import { styled, Container, Box, Flex } from "~/styled-system/jsx";
import { RiArrowDownSLine } from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";
import { ImageContainer } from "~/components/ImageContainer";
import type { Route } from "./+types/tournaments.user-guide";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | Tournament User Guide` },
    {
      name: "description",
      content: "A comprehensive guide to using our tournament system",
    },
  ];
};

const H1 = styled("h1", {
  base: {
    fontSize: "4xl",
    fontWeight: "extrabold",
    textWrap: "balance",
  },
});

const B = styled("span", {
  base: {
    fontWeight: "bold",
    color: "brand.500",
  },
});

const H2 = styled("h2", {
  base: {
    fontSize: {
      base: "xl",
      md: "2xl",
    },
    fontWeight: "extrabold",
    textWrap: "balance",
  },
});

const P = styled("p", {
  base: {
    color: "gray.400",
    marginTop: 2,
  },
});

const UL = styled("ul", {
  base: {
    listStyle: "initial",
    paddingLeft: 4,
    color: "gray.400",
  },
});

const OL = styled("ol", {
  base: {
    listStyle: "decimal",
    paddingLeft: 4,
    color: "gray.400",
  },
});

const Card = styled("div", {
  base: {
    borderWidth: 1,
    borderColor: "gray.800",
    rounded: "xl",
    overflow: "hidden",
    bgColor: "gray.900",
  },
});

const CardHeader = styled("button", {
  base: {
    w: "full",
    p: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    _hover: {
      md: {
        bgColor: "gray.800",
      },
    },
  },
});

const CardContent = styled("div", {
  base: {
    p: 6,
    borderTopWidth: 1,
    borderColor: "gray.800",
  },
});

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleCard = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) => {
  const disclosure = useDisclosure(defaultOpen);

  return (
    <Card>
      <CardHeader onClick={disclosure.toggle}>
        <H2 textAlign="left">{title}</H2>
        <Box
          transform={disclosure.isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
          color="gray.400"
        >
          <RiArrowDownSLine size={24} />
        </Box>
      </CardHeader>
      {disclosure.isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
};

const Page = () => {
  return (
    <Container maxW={800} px={2} pt={8} pb={20}>
      <Box mb={12} textAlign="center" maxW={600} mx="auto">
        <H1>Tournaments: User Guide</H1>
        <P>
          We have built a free online platform to help assist with hosting
          Radio-Controlled Drifting tournaments and competitions.
        </P>
      </Box>

      <Flex flexDir="column" gap={2}>
        <CollapsibleCard title="1. Getting Started">
          <P mt={4}>To begin using the tournament software:</P>

          <OL mt={2}>
            <styled.li>
              Visit our website and <B>login or create a new account</B>
            </styled.li>
            <styled.li>
              Once logged in, <B>open the menu (≡)</B> at the top of the page{" "}
              and select <B>"Tournaments"</B>
            </styled.li>
            <styled.li>
              Then select the <B>"+ Create New"</B> button to create a new
              tournament
            </styled.li>
            <styled.li>
              Enter a name for your tournament when prompted
            </styled.li>
            <styled.li>
              Configure your tournament settings:
              <UL mt={2} ml={4}>
                <styled.li>
                  Battle format: Choose between Standard or Double Elimination
                </styled.li>
                <styled.li>
                  Qualifying laps: Set the number of qualifying laps for each
                  driver
                </styled.li>
                <styled.li>
                  Tournament judges: Selected{" "}
                  <B>judges must have an account on the website</B> to appear in
                  the list
                </styled.li>
                <styled.li>
                  Tournament drivers: Similarly,{" "}
                  <B>all drivers must have an account on the website</B>
                </styled.li>
              </UL>
            </styled.li>
            <styled.li>
              Once you've completed the setup, select{" "}
              <B>"I'm ready, let's go!"</B> to proceed
            </styled.li>
          </OL>

          <ImageContainer>
            <styled.img
              src="/tournaments/start.png"
              alt="Start new tournament"
              width="100%"
            />
          </ImageContainer>
        </CollapsibleCard>

        <CollapsibleCard title="2. Tournament Pages">
          <P>
            After setup, you'll be taken to the public tournament page, which
            you can share via its URL for real-time viewing of results.
          </P>

          <P>The page contains three tabs:</P>
          <UL>
            <styled.li>
              Overview: Summarizes current tournament activity.
            </styled.li>
            <styled.li>
              Qualifying: Displays a table of qualifying standings.
            </styled.li>
            <styled.li>
              Battles: Shows a battle tree for either Standard or Double
              Elimination format, with the option to toggle between upper and
              lower brackets.
            </styled.li>
          </UL>
          <ImageContainer>
            <styled.img
              src="/tournaments/overview.png"
              alt="Tournament page"
              width="100%"
            />
          </ImageContainer>
        </CollapsibleCard>

        <CollapsibleCard title="3. Judging">
          <P>
            Tournament judging is managed via the Judging Remote, which is only
            accessible to users designated as judges during the tournament
            setup.
          </P>

          <P>
            <B>How to Access the Judging Remote:</B>
          </P>
          <OL>
            <styled.li>Login to your account.</styled.li>
            <styled.li>
              Navigate to the <B>“Tournaments”</B> page.
            </styled.li>
            <styled.li>
              Then select the relevant tournament to open its page.
            </styled.li>
            <styled.li>
              Judges will see an <B>“Open Judging”</B> button. Select this to
              open the Judging Controller.
            </styled.li>
          </OL>

          <P>
            The Judging Controller updates in real-time with the next required
            action.
          </P>

          <P>
            Once all judges have submitted their scores, the tournament creator
            will see a <B>“Start Next Run”</B> button on the tournament page.
            Clicking this progresses the tournament to the next qualifying run.
          </P>

          <P>
            After all qualifying runs are completed, a <B>“End Qualifying”</B>{" "}
            button will appear. Clicking this will finalize qualifying results
            and generate the battle tree(s).
          </P>

          <ImageContainer>
            <styled.img
              src="/tournaments/judging.png"
              alt="Judging remote"
              width="100%"
            />
          </ImageContainer>
        </CollapsibleCard>

        <CollapsibleCard title="4. Battles">
          <P>
            Once qualifying ends, the tournament moves to the battle phase,
            where drivers compete in 1v1 battles according to the generated
            tree(s).
          </P>
          <P>
            The Judging Controller updates to reflect the battle phase,
            prompting judges to select a winner for each battle.
          </P>
          <UL>
            <styled.li>
              After all judges have made their selections, the tournament
              creator will see a <B>“Start Next Battle”</B> button to progress
              to the next battle.
            </styled.li>
            <styled.li>
              Repeat this process until the tournament concludes.
            </styled.li>
          </UL>

          <ImageContainer>
            <styled.img
              src="/tournaments/battles.png"
              alt="Battles"
              width="100%"
            />
          </ImageContainer>
        </CollapsibleCard>

        <CollapsibleCard title="Important Notes">
          <P>
            <B>Irreversible Actions:</B> Currently, actions like “Start Next
            Run,” “End Qualifying,” and “Start Next Battle” cannot be undone.
            Double-check all decisions before confirming. Future updates will
            include the ability to undo or rewind actions.
          </P>
          <P>
            <B>Browser Refresh:</B> If the screen doesn't update as expected,
            refresh your browser to load the latest tournament state. load the
            latest tournament state.
          </P>
        </CollapsibleCard>
      </Flex>
    </Container>
  );
};

export default Page;
