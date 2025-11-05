import { Router } from "express";
import healthCheck from "../controllers/healtcheck.controller.js";

const router =  Router()
router.route('/').get(healthCheck)




export default router