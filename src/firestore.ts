import {applicationDefault, getApps, initializeApp} from "firebase-admin/app"
import {getFirestore} from "firebase-admin/firestore"

export const FIRESTORE_BATCH_SIZE = 500

export function firestore() {
    if (getApps().length === 0) {
        initializeApp({
            credential: applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID
        })
    }

    return getFirestore()
}
