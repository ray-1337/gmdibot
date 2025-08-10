import { firestore } from "../../handler/Firebase";

export const registeredUserCollection = firestore.collection("registered-user");

export const submissionUserCollection = firestore.collection("user-verification-submission");