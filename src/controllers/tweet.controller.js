
import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
  console.log(req.body);
  
    const{content} = req.body;
    //validation on content
    if([content].some((value)=>value.trim()==="")){
      throw new ApiError(400,"content feel required")
    }
    //create user Object by using Tweet.create
    const tweet =await Tweet.create({
      owner:req.user._id,
      content
    })
    //set apiResponse
    return res.status(200).json(new ApiResponse(200,tweet,"Tweet created succesfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if(!userId){
      throw new ApiError(400,"insert UserId  ")
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
      throw new ApiError(400, "Invalid user ID format")
    }

    const tweets = await Tweet.aggregate([
      {
        $match:{
          owner: new mongoose.Types.ObjectId(userId)
        }
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
                username: 1,
                fullName: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          owner: { $first: "$owner" }
        }
      },
      {
        $group: {
          _id: "$owner._id",
          tweets: { $push: "$$ROOT" },
          totalTweets: { $sum: 1 }
        }
      },
      {
        $project: {
          tweets: {
            $map: {
              input: "$tweets",
              as: "tweet",
              in: {
                _id: "$$tweet._id",
                content: "$$tweet.content",
                createdAt: "$$tweet.createdAt",
                updatedAt: "$$tweet.updatedAt"
              }
            }
          },
          owner: { $first: "$tweets.owner" },
          totalTweets: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])

    if (!tweets?.length) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No tweets found for this user"))
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const{tweetId} = req.params;
    const{content} = req.body;
    if(!tweetId){
      throw new ApiError(400,"pass tweet Id in url")
    }
    if(!content){
      throw new ApiError(400,"pass content")
    }
    
    
    const tweet = await Tweet.findById(tweetId);
    
    if(tweet.owner.toString()!==req.user._id.toString()){
         throw new ApiError(400,"ur not a owner of a tweet")
    }
    tweet.content = content;
    await tweet.save({validateBeforeSave:false})

     return res
   .status(200)
   .json(new ApiResponse(200,tweet,"content of tweet changed Succesfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const{tweetId} = req.params;
     if(!tweetId){
      throw new ApiError(400,"pass tweet Id in url")
    }
    const tweet = await Tweet.findById(tweetId);
    if(tweet.owner.toString()!==req.user._id.toString()){
         throw new ApiError(400,"ur not a owner of a tweet")
    }
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId);
    if(!deleteTweet){
      throw new ApiError(400,"error while deleting the tweet")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"tweet deleted succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}