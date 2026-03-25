import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "documind",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
