import { Router } from "express";
import { verifyJWT } from "../middelewares/auth.middelware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";


const router = Router()
router.use(verifyJWT);
router.route("/:playlistId").get(getPlaylistById).delete(deletePlaylist).patch(updatePlaylist);
router.route('/').post(createPlaylist);
router.route('/user-playlist/:userId').get(getUserPlaylists);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router;