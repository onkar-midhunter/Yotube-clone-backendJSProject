import { Router } from "express";
import { verifyJWT } from "../middelewares/auth.middelware.js";
import { upload } from "../middelewares/multer.middelware.js";
import { deleteVideoById, getAllVideos, getAllVideosPublic, getVideoById, publishshVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router =  Router()

// normalize multiple slashes (e.g. //) in the URL to avoid accidental route mismatches
// router.use((req, _res, next) => {
//   if (req.url && req.url.includes("//")) {
//     req.url = req.url.replace(/\/+/g, "/");
//   }
//   next();
// });


router.route('/').get(getAllVideosPublic)
router.use(verifyJWT);



router
.route('/private')
.get(getAllVideos)
.post(upload.fields([
  {
    name:"videoFile",
    maxCount:1
  },{
    name:"thumbnail",
    maxCount:1
  }
]),publishshVideo)

// register specific routes before the generic 
// ":videoId" route so they don't get captured as a videoId value
router.route('/toggle/publish/:videoId').patch(togglePublishStatus)

router
.route("/:videoId")
.get(getVideoById)
.delete(deleteVideoById)
.patch(upload.single("thumbnail"),updateVideo);


export default router