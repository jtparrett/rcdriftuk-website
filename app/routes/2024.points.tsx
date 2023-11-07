import { Box, Container, styled } from "~/styled-system/jsx";

const Page = () => {
  return (
    <styled.main>
      <Container py={{ base: 0, md: 8 }}>
        <Box maxW={800}>
          <styled.h1 fontSize="3xl" fontWeight="bold">
            Driver Points
          </styled.h1>
          <styled.p pb={4}>
            See how the top drivers from accross the championship are ranking up
            ahead of the final.
          </styled.p>

          <Box
            rounded="lg"
            borderWidth={1}
            borderColor="gray.700"
            overflow="hidden"
            p={4}
          >
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
              </styled.body>
            </styled.table>
          </Box>
        </Box>
      </Container>
    </styled.main>
  );
};

export default Page;
