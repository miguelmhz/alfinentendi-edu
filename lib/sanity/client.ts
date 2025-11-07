import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "18mp5qxj",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});