import mongoose from "mongoose";
import {Video} from "../models/video.model.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.Model.js";
import { json } from "express";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId} = req.params;
    //convert to Object Id 
    const channelObjectId = new mongoose.Types.ObjectId(channelId)
    //to get total video and views
    const videoStats = await Video.aggregate([
      {
        $match:{
          owner:channelObjectId
        }
      },
      {
        $group:{
          _id:null,
          totalVideo:{$sum:1},
          totalviews:{$sum:"$views"}
        }
      }
    ]);
    const {totalVideo=0,totalviews=0} = videoStats[0] || {};
    //total susbcriber 
    const susbcriberCount = await Subscription.countDocuments({
      channel: channelObjectId
    });
    const subscribedCount = await Subscription.countDocuments({
      subscriber:channelObjectId
    });
    //total likes
    const totalLikeResult = await Like.aggregate([
      {
        $lookup:{
          from:"videos",
          localField:"video",
          foreignField:"_id",
          as:"videoInfo"
        }
      },
      {
        $unwind:"$videoInfo"
      },
      {
        $match:{
          "videoInfo.owner":channelObjectId
        }
      },
      {
        $count:"totalLikes"
      }
    ])
    const totalLikes = totalLikeResult[0]?.totalLikes || 0;
    //combine result
    const channelStats = {
      totalVideo,
      totalviews,
      totalLikes,
      susbcriberCount,
      subscribedCount
    };

    return res
    .status(200)
    .json(new ApiResponse(200,channelStats,"channel stats fetched succesfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
      const { channelId} = req.params;
      const channelVideo = await Video.aggregate([
          {
            $match:{
              owner: new mongoose.Types.ObjectId(channelId)
            }
          },
          {
            $sort:{
              createdAt:-1
            }
          },
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[{
                $project:{
                  fullName:1,
                  userName:1,
                  Avatar:1
                }
              }]

            }
          },
          {
            $addFields:{
              owner:{$first: "$owner"}
            }
          },
          {
            $project:{
              videoFile:1,
              thumbnail:1,
              title:1,
              description:1,
              duration:1,
              views:1,
              owner:1
            }
          }
      ])

      if(!channelVideo.length){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"channel has no video"))
      }
       return res
        .status(200)
        .json(new ApiResponse(200,channelVideo,"channel video fetch succesfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }

