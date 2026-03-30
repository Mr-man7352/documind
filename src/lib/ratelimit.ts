import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

// Sliding window: 100 requests per 60 seconds, keyed by API key prefix
export const widgetRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true, // tracks usage in Upstash dashboard
  prefix: "documind:widget",
});

// Sliding window: 30 requests per 60 seconds, keyed by userId
export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "documind:chat",
});
