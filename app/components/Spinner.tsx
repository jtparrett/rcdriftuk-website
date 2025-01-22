import { styled } from "~/styled-system/jsx";

export const Spinner = () => {
  return (
    <styled.span
      display="flex"
      gap={1}
      alignItems="center"
      justifyContent="center"
    >
      {[0, 1, 2].map((index) => (
        <styled.span
          key={index}
          w={1}
          h={1}
          bgColor="white"
          rounded="full"
          animation="bounce 1s infinite ease-in-out"
          style={{
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </styled.span>
  );
};
