import { Router } from "express";
import { verifyJWT } from "../middelewares/auth.middelware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()
router.use(verifyJWT);
router.route('/user/:subscriberId').get(getSubscribedChannels);
router.route('/:channelId').post(toggleSubscription).get(getUserChannelSubscribers);
export default router;