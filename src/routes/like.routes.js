import { Router } from "express";
import { verifyJWT } from "../middelewares/auth.middelware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";


const router =  Router()

router.use(verifyJWT)
router.route('/getUserLikeVideo').get(getLikedVideos)
router.route('/video/:videoId').post(toggleVideoLike)
router.route('/comment/:commentId').post(toggleCommentLike)
router.route('/tweet/:tweetId').post(toggleTweetLike)



export default router