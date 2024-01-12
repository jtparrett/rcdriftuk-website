import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Box, Container, Divider, styled } from "~/styled-system/jsx";

const Page = () => {
  return (
    <styled.main>
      <Container px={2} maxW={1100}>
        <Breadcrumbs
          paths={[
            {
              to: "/2024/standings",
              title: "Standings",
            },
          ]}
        />

        <Box maxW={800}>
          <styled.h1
            fontSize="5xl"
            fontFamily="heading"
            lineHeight={1}
            fontStyle="italic"
          >
            Driver Standings
          </styled.h1>
          <styled.p>
            See how the top drivers from accross the championship are ranking
            ahead of the final.
          </styled.p>

          <Box maxW={200} h="4px" bgColor="brand.500" mt={2} mb={6} />

          <Box rounded="xl" bgColor="gray.900" overflow="hidden" px={8} py={4}>
            <styled.table w="full">
              <styled.thead>
                <styled.tr borderBottomWidth={1} borderColor="gray.500">
                  <styled.th py={2}>#</styled.th>
                  <styled.th py={2}>Driver</styled.th>
                  <styled.th py={2}>Team</styled.th>
                  <styled.th textAlign="right" py={2}>
                    Points
                  </styled.th>
                </styled.tr>
              </styled.thead>
              <styled.body>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
                <styled.tr>
                  <styled.td colSpan={4}>-</styled.td>
                </styled.tr>
              </styled.body>
            </styled.table>
          </Box>
        </Box>
      </Container>
    </styled.main>
  );
};

export default Page;
