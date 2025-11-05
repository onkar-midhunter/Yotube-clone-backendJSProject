import { Router } from "express";
import { addToWatchHistory, changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logOutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middelewares/multer.middelware.js";
import { verifyJWT } from "../middelewares/auth.middelware.js";

const router = Router()

router.route('/register').post(
  upload.fields([
  {
    name:"avatar",
    maxCount:1
  },
  {
    name:"coverImage",
    maxCount:1
  }
])
,registerUser)


router.route('/login').post(loginUser)


//secured router
router.route('/logout').post(verifyJWT, logOutUser)
router.route('/refresh-token').patch(refreshAccessToken)
router.route('/change-password').patch(verifyJWT,changeCurrentPassword);
router.route('/current-user').get(verifyJWT,getCurrentUser);
router.route('/update-account').patch(verifyJWT,updateAccountDetails);


router.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route('/Cover-Image').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

router.route('/c/:userName').get(verifyJWT,getUserChannelProfile);
router.route('/history').get(verifyJWT,getWatchHistory)
router.route('/watch/:videoId').patch(verifyJWT,addToWatchHistory)


export default router