import { styled, Flex, Box } from "~/styled-system/jsx";
import { RANKS } from "~/utils/getDriverRank";

const SELECTABLE_RANKS = [
  { value: RANKS.DIAMOND, label: "Diamond" },
  { value: RANKS.PLATINUM, label: "Platinum" },
  { value: RANKS.GOLD, label: "Gold" },
  { value: RANKS.SILVER, label: "Silver" },
  { value: RANKS.BRONZE, label: "Bronze" },
  { value: RANKS.STEEL, label: "Steel" },
  { value: RANKS.UNRANKED, label: "Unranked" },
] as const;

interface Props {
  selectedRanks: string[];
  onChange: (ranks: string[]) => void;
}

export const RankSelector = ({ selectedRanks, onChange }: Props) => {
  const toggle = (rank: string) => {
    if (selectedRanks.includes(rank)) {
      onChange(selectedRanks.filter((r) => r !== rank));
    } else {
      onChange([...selectedRanks, rank]);
    }
  };

  return (
    <Box>
      <Flex flexWrap="wrap" gap={2}>
        {SELECTABLE_RANKS.map((rank) => {
          const isSelected = selectedRanks.includes(rank.value);
          return (
            <styled.button
              key={rank.value}
              type="button"
              onClick={() => toggle(rank.value)}
              display="flex"
              alignItems="center"
              gap={1.5}
              px={3}
              py={2}
              rounded="xl"
              fontWeight="semibold"
              fontSize="sm"
              cursor="pointer"
              transition="all .2s"
              borderWidth={1}
              borderColor={isSelected ? "gray.600" : "gray.800"}
              bgColor={isSelected ? "gray.800" : "gray.900"}
              opacity={isSelected ? 1 : 0.5}
              _hover={{ opacity: 0.8 }}
            >
              <styled.img
                src={`/badges/${rank.value}.png`}
                alt={rank.label}
                w={5}
                h={5}
              />
              {rank.label}
            </styled.button>
          );
        })}
      </Flex>
      {selectedRanks.map((rank) => (
        <input key={rank} type="hidden" name="allowedRanks" value={rank} />
      ))}
      <styled.p color="gray.500" fontSize="xs" mt={2}>
        {selectedRanks.length === 0
          ? "No restriction — open to all drivers"
          : "Only selected ranks can purchase tickets"}
      </styled.p>
    </Box>
  );
};
