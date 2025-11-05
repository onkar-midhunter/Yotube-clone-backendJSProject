import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const aggregatePipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
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
        content: 1,
        video: 1,
        owner: 1,
      },
    },
  ];
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };

  const comments = await Comment.aggregatePaginate(
    Comment.aggregate(aggregatePipeline),
    options
  );

  
  return res
    .status(200)
    .json(
      new ApiResponse(200, comments, "fetched all comment on particular video")
    );
});

const addReplyToComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId) {
    throw new ApiError(400, "Comment Id is Missing");
  }
  if ([content].some((val) => val.trim() === "")) {
    throw new ApiError(400, "enter a comment");
  }
  // validate commentId format
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId format");
  }

  const ParentComment = await Comment.findById(commentId);
  if (!ParentComment) {
    throw new ApiError(404, "Parent comment not found");
  }

  const reply = await Comment.create({
    content,
    video: ParentComment.video,
    owner: req.user._id,
    parentComment: commentId,
  });

  // Return the created reply (and not the parent) to the client
  return res
    .status(201)
    .json(new ApiResponse(201, reply, "Reply to comment created"));
});

const getVideoCommentAndReply = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }
  const aggregatePipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parentComment: null,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
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
    //now we are showing the reply on the comments
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "parentComment",
        as: "reply",
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
                    fullname: 1,
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
              content: 1,
              reply: 1,
              owner: 1,
            },
          },
        ],
      },
    },
   
    {
      $project: {
        owner: 1,
        reply: 1,
        content: 1,
        video: 1,
        createdAt: 1,
      },
    },
  ];
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const comments = await Comment.aggregatePaginate(
    Comment.aggregate(aggregatePipeline),
    options
  );

 


  return res
    .status(200)
    .json(new ApiResponse(200, comments, "get comment with replies"));
});
const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if ([content].some((val) => val.trim() === "")) {
    throw new ApiError(400, "enter a comment");
  }
  if (!videoId) {
    throw new ApiError(400, "enter Video Id to add a comment");
  }
  const comment = await Comment.create({
    content,
    owner: req.user._id,
    video: videoId,
  });
  if (!comment) {
    throw new ApiError(400, "Error while creating comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment Created Succesfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;

  const { content } = req.body;
  if ([content].some((val) => val.trim() === "")) {
    throw new ApiError(400, "update a comment");
  }
  if (!commentId) {
    throw new ApiError(400, "enter Video Id to add a comment");
  }
  //only a owner of a comment can change the comment
  const comment = await Comment.findById(commentId);
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "only a owner can add a comment");
  }

  const update = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  if (!update) {
    throw new ApiError(400, "Problem while updating the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, update, "comment updated Succesfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  // accept commentId either as path param or query param
  const commentId = req.params.commentId || req.query.commentId;
  if (!commentId) {
    throw new ApiError(400, "pass commentId in url or query");
  }

  // only an owner of a comment can delete the comment
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "only the owner can delete this comment");
  }

  const deleted = await Comment.findByIdAndDelete(commentId);
  if (!deleted) {
    throw new ApiError(400, "Problem while deleting the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  addReplyToComment,
  getVideoCommentAndReply,
};
