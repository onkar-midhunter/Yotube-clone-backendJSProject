import mongoose from "mongoose";
import { Like } from "../models/like.Model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  //check on videoId
  //check it's user like that video or not if it's existed unlike the document

  const userId = req.user._id;
  const existed = await Like.findOne({ video: videoId, likedBy: userId });
  if (existed) {
    await Like.findByIdAndDelete(existed._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "unlike video succesfully"));
  } else {
    const likeVideo = await Like.create({
      video: videoId,
      likedBy: userId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, likeVideo, "like video succesfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const userId = req.user._id;
  const existed = await Like.findOne({ comment: commentId, likedBy: userId });
  if (existed) {
    await Like.findByIdAndDelete(existed._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "unlike comment succesfully"));
  } else {
    const likeComment = await Like.create({
      comment: commentId,
      likedBy: userId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, likeComment, "like comment succesfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const userId = req.user._id;
  const existed = await Like.findOne({ tweet: tweetId, likedBy: userId });
  if (existed) {
    await Like.findByIdAndDelete(existed._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "unlike tweet succesfully"));
  } else {
    const likeTweet = await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, likeTweet, "like tweet succesfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;
  const userLikedVideo = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        tweet: null,
        comment: null,
      },
    },
    //get a name of likedBy users
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedBy",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likedBy: { $first: "$likedBy" },
      },
    },
    //lookup for video and video names
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    
                      fullName: 1,
                      userName: 1,
                      avatar: 1,
                    
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: { $first: "$video" },
      },
    },
    {
      $project: {
        likedBy: 1,
        video: 1,
      },
    },
  ]);
  return res
  .status(200)
  .json(new ApiResponse(200,userLikedVideo,"User Like video fetch succesfully"))
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
