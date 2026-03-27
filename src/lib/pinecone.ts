import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const pineconeIndex = pinecone.index({
  name: process.env.PINECONE_INDEX!,
});

// too see the similarity metric and embedding model used in the index, you can check the index description
// const indexDescription = await pinecone.describeIndex(
//   process.env.PINECONE_INDEX!,
// );

// console.log(indexDescription);
