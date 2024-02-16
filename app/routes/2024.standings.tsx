import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Box, Container, styled } from "~/styled-system/jsx";

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
          <styled.h1 fontSize="4xl" fontWeight="extrabold">
            Driver Standings
          </styled.h1>
          <styled.p mb={4} color="gray.500">
            See how the top drivers from accross the championship are ranking
            ahead of the final.
          </styled.p>

          <Box
            rounded="xl"
            borderWidth={1}
            borderColor="gray.800"
            overflow="hidden"
            px={8}
            py={4}
          >
            <styled.table w="full">
              <styled.thead>
                <styled.tr borderBottomWidth={1} borderColor="gray.800">
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
