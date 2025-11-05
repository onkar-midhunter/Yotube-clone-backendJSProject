import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  //get name and description from req.body
  //check name and description should not be null
  //create Playlist object in mongoDb atlas by create method here video array should be undefined
  //check refference is save or not
  //send response

  if ([name, description].some((val) => val.trim() === "")) {
    throw new ApiError(400, "enter name and description");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "new playlist is created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  if (!req.params.userId) {
    throw new ApiError(400, "pass userId in url");
  }
  const { userId } = req.params;

  const result = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    //lookup for owner
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
    //lookup for Video and video owner nested lookup
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
              title: 1,
              description: 1,
              thumbnail: 1,
              videoFile: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        owner: 1,
        videos: 1,
        description: 1,
        name: 1,
      },
    },
  ]);
  if (result.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User have no any playlist"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "User playlist fetched succesfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  if (!req.params.playlistId) {
    
    throw new ApiError(400, "pass playlistId in URI");
  }
  const { playlistId } = req.params;
  //TODO: get playlist by id
  //get playlistById here also we can use pipeline for show video name and owner name

  const result = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
    //lookup on videos
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
              title: 1,
              description: 1,
              thumbnail: 1,
              videoFile: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
      },
    },
  ]);

   if (!result.length) {
   throw new ApiError(400,"Invalid playlist Id")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "playlist fetch succesfully"));

});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  if (!req.params) {
    throw new ApiError(400, "pass id in url");
  }
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  if(playlist.owner.toString() !== req.user._id.toString()){
    throw new ApiError(400,"Owner only can only add to the playlist")
  }
  //add video in the playlist by findByIdAndUpdate method
  const playlistnew = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  );
  if (!playlistnew) {
    throw new ApiError(400, "error while video added to the playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlistnew, "video is added to the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if(!playlistId && !videoId){
    throw new ApiError(400,"enter playlistId and VideoId")
  }
  const playlist = await Playlist.findById(playlistId);
  if(playlist.owner.toString() !== req.user._id.toString()){
    throw new ApiError(400,"Owner only can only remove video from the playlist")
  }
  const newPlaylist = await Playlist.findByIdAndUpdate(playlistId,
    {
    $pull:{videos:videoId},
     },
    {
      new:true 
    })

    if(!newPlaylist){
      throw new ApiError(400,"problem while deleting video from playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "video is removed from the playlist"));

});

const deletePlaylist = asyncHandler(async (req, res) => {
  if(!req.params.playlistId){
    throw new ApiError(400,"pass PlaylistId in URI")
  }
  const { playlistId } = req.params;
  // TODO: delete playlist
  //check on req.params.playlistId
  //check the requested user and owner of playlist is same
  //if it's true then perfrom findByIdAndDelete query on this
  //check reference variable and send response
  const playlist = await Playlist.findById(playlistId);
  if(playlist.owner.toString() !== req.user._id.toString()){
    throw new ApiError(400,"Owner only can delete the playlist")
  }
  const deleted = await Playlist.findByIdAndDelete(playlistId);
  if(!deleted){
     throw new ApiError(400,"error while deleting the playlist")
  }
  return res.status(200)
  .json(new ApiResponse(200,deleted.name,"delete playlist Succesfully"))

});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const playlist = await Playlist.findById(playlistId);
  if(playlist.owner.toString() !== req.user._id.toString()){
    throw new ApiError(400,"Owner only can update the playlist")
  }

  const updatedFields={};
  if(name) updatedFields.name = name;
  if(description) updatedFields.description = description;

  const update = await Playlist.findByIdAndUpdate(playlistId,
    {
      $set:updatedFields
    },
    {
      new:true
    }
  )
  if(!update){
    throw new ApiError(400,"Problem while updating the fields")
  }
   return res
   .status(200)
  .json(new ApiResponse(200,update,"update  playlist Succesfully"))
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
