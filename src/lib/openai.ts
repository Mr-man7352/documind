import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing environment variable: OPENAI_API_KEY");
}

export const openaiClient = new OpenAI({ apiKey });
