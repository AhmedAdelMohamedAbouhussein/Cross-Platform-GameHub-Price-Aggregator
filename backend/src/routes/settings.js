import express from "express";
import upload from "../middleware/multer.js";
import { profileImage } from "../controllers/settings/profileImage.js";

const router = express.Router();

router.post("/profileimage", upload.single("profileImage"), profileImage);

export default router;
