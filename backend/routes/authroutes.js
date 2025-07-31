import express from "express";
import { firebaseLogin, emailLogin, storeCalToken, getEvents, calConScreen, calStoreToken } from "../controllers/authcontroller.js";


const router = express.Router();

// When a POST request comes to /api/auth/firebase-login,
// call the firebaseLogin function
router.post("/firebase-login", firebaseLogin);

//call the emailLogin function
router.post("/email-login", emailLogin);

router.post("/store-calendar-token", storeCalToken);
// You can add more auth-related routes here

router.get("/event-fetch", getEvents);

router.get("/calendar-consent",calConScreen);

router.get("/calendar-store-token", calStoreToken);

export default router;