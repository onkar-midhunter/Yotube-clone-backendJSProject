import { Router } from "express";
import { verifyJWT } from "../middelewares/auth.middelware.js";
import { addComment, addReplyToComment, deleteComment, getVideoCommentAndReply, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router();
// router.route('/:videoId').get(getVideoComments)
router.route('/:videoId').get(getVideoCommentAndReply)
router.use(verifyJWT);
router.route('/add/:videoId').post(addComment)
router.route('/replyComment/:commentId').post(addReplyToComment);


router.route('/update/:commentId').patch(updateComment);
router.route('/delete/:commentId').delete(deleteComment);

export default router;