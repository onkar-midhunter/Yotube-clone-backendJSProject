import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  //check user is owner are not
  if (subscriberId.toString() === channelId.toString()) {
    throw new ApiError(400, "u are owner of this channel");
  }
  //if user is aleready subscribed then unSubscribe means deleting the document
  const existed = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });
  if (existed) {
    await Subscription.findByIdAndDelete(existed._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed Succesfully"));
  }

  const newSub = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, newSub, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
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
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
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
      $lookup:{
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "ChannelOwner",
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
        subscriber: { $first: "$subscribers" },
      },
    },
    {
      $addFields: {
        channelOwner: { $first: "$ChannelOwner" },
      },
    },
    {
      $project: {
        subscribers: 0, // remove array field
        channelOwner: 0
      },
    },
  ]);
  if (!subscriber) {
    throw new ApiError(400, "there is an error while fetching Subscribers");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscriber, "fetched all subscribers"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const result = await Subscription.aggregate([
    {
      $match:{
        subscriber: new mongoose.Types.ObjectId(subscriberId)
      }
    },
    {
      $sort:{
        createdAt:-1
      }
    },{
      $lookup:{
        from:"users",
        localField:"channel",
        foreignField:"_id",
        as:"subscribedChannel",
        pipeline:[{
            $project:{
              fullName:1,
              userName:1,
              avatar:1
            }
        }]
      }
    }, {
      $addFields: {
        channel: { $first: "$subscribedChannel" },
      },
    }, {
      $project: {
        subscribedChannel: 0, // remove array
        subscriber: 0,        // optional: if you don't want subscriber id in response
        __v: 0,
      },
    },
  ])

   return res
    .status(200)
    .json(new ApiResponse(200, result, "fetched all channels"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
