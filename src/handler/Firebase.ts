import { Firestore } from "@google-cloud/firestore";

const [projectId, databaseId, client_email, private_key] = (process.env.FIRESTORE_KEY as string).split(" | ");

export const firestore = new Firestore({
  projectId, databaseId,
  ssl: true,
  credentials: {
    client_email, private_key,
  }
});