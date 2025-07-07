import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { RiUpload2Line } from "react-icons/ri";

interface Props {
  name: string;
  onChange: (file: File) => void;
  value: File | string | null;
  size?: number;
  isLoading?: boolean;
}

export const ImageInput = ({
  name,
  onChange,
  value,
  size = 16,
  isLoading,
}: Props) => {
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onChange?.(file);
    }
  };

  const imageUrl = value instanceof File ? URL.createObjectURL(value) : value;

  return (
    <Box
      w={size}
      h={size}
      overflow="hidden"
      rounded="2xl"
      pos="relative"
      bgColor="gray.800"
      borderWidth={1}
      borderColor="gray.800"
      cursor="pointer"
    >
      <Input
        pos="absolute"
        inset={0}
        opacity={0}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        zIndex={2}
        cursor="pointer"
        multiple={false}
        disabled={isLoading}
      />
      {imageUrl && (
        <styled.img
          src={imageUrl}
          alt="Uploaded"
          w="full"
          h="full"
          objectFit="cover"
          opacity={0.7}
        />
      )}
      <Center
        pos="absolute"
        inset={0}
        pointerEvents="none"
        zIndex={2}
        cursor="pointer"
      >
        {isLoading ? (
          <Box
            w={size / 2}
            h={size / 2}
            rounded="full"
            animation="spin .8s linear infinite"
            borderWidth={2}
            borderColor="transparent"
            borderTopColor="white"
          />
        ) : (
          <RiUpload2Line size={size * 2} />
        )}
      </Center>
    </Box>
  );
};
