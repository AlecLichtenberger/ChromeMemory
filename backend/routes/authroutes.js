import express from "express";
import { firebaseLogin, emailLogin } from "../controllers/authcontroller.js";


const router = express.Router();

// When a POST request comes to /api/auth/firebase-login,
// call the firebaseLogin function
router.post("/firebase-login", firebaseLogin);

//call the storeCalendarToken function
router.post("/email-login", emailLogin);

// You can add more auth-related routes here

export default router;