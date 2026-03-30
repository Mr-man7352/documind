import { Inngest } from "inngest";

const eventKey = process.env.INNGEST_EVENT_KEY;
if (!eventKey) {
  throw new Error("Missing environment variable: INNGEST_EVENT_KEY");
}

export const inngest = new Inngest({
  id: "documind",
  eventKey,
});
