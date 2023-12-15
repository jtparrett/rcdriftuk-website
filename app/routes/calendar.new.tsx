import { Form } from "@remix-run/react";
import { Button } from "~/components/Button";
import { Box } from "~/styled-system/jsx";

const CalendarNewPage = () => {
  return (
    <Box>
      <Form>
        <input name="name" />
        <input name="track" />
        <Button type="submit">Create Event</Button>
      </Form>
    </Box>
  );
};

export default CalendarNewPage;
