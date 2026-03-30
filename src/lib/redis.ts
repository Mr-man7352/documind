import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url) throw new Error("Missing environment variable: UPSTASH_REDIS_REST_URL");
if (!token) throw new Error("Missing environment variable: UPSTASH_REDIS_REST_TOKEN");

export const redis = new Redis({ url, token });
