import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.service.js";



const getAllVideos = asyncHandler(async(req,res)=>{
     const { page = 1,limit=10,query,sortBy,sortType,userId} = req.query;
     //convert to Number 
     const pageNumber = Number(page);
     const limitNumber = Number(limit)
     console.log(query);
     const matchStage = {};
     if(query){
      matchStage.$or = [
        {title:{$regex:query,$options: "i"}},
        {description:{$regex:query,$options:"i"}}
     ];
     }
     if(userId){
      matchStage.owner = new mongoose.Types.ObjectId(userId);
     }
     matchStage.isPublished = true;

     const sortStage = {};
     if (sortBy) {
       sortStage[sortBy] = sortType === "asc" ? 1 : -1;
     } else {
       // default sort by creation date desc
       sortStage.createdAt = -1;
     }

     const aggregationPipeline = [
      {
        $match: matchStage,
      },
      {
        $sort: sortStage,
      },
      {
        $lookup: {
          // MongoDB collection names are lowercase plural by default for Mongoose models
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
        // keep videos even if owner lookup yields empty array
        $unwind: { path: "$owner", preserveNullAndEmptyArrays: true },
      },
     ];

     const options={
      page:pageNumber,
      limit:limitNumber
     }

     const videos = await Video.aggregatePaginate(
      Video.aggregate(aggregationPipeline),
      options
     )

     return res
     .status(200)
     .json(new ApiResponse(200,videos,"fetched all video succesfully"))
})

const publishshVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Quick validation: ensure files were received
  const receivedFileFields = Object.keys(req.files || {});
  if (receivedFileFields.length === 0) {
    throw new ApiError(
      400,
      `No files received. Expected fields: videoFile, thumbnail. Received fields: ${JSON.stringify(receivedFileFields)}`
    );
  }

  //check title and description is null or not
  if ([title, description].some((value) => value.trim() === "")) {
    throw new ApiError(400,"title and description are empty");
  }
  //get files from req.files
  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  //check localpath exist or not
  if (!videoFileLocalPath) {
    throw new ApiError(400, "video file is Missing");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "video file is Missing");
  }
  //before we have to get our login user
 
  
  //upload on Cloudinary
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  //create video object
  const videoCreated = await Video.create({
    videoFile: videoFile.secure_url,
    thumbnail: thumbnail.secure_url,
    title,
    description,
    duration: videoFile.duration || 0,
    isPublished: true,
    owner: req.user._id,
  });
  //set value in ApiResponse
  return res
    .status(201)
    .json(new ApiResponse(200, videoCreated, "video published succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id is not present");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }
  const video = await Video.findById(videoId).populate(
    "owner",
    "userName email"
  );
  if (!video) {
    throw new ApiError(400, "video is not present in the databse");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "get video By Id succesfully"));
});
const deleteVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id is not present");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }
  //delete thumbnail and video from cloudinary
  const video = await Video.findById(videoId);
  if(!video){
      throw new ApiError(400,"Video is not available")
    }
  if(video.owner.toString() !== req.user._id.toString()){
      throw new ApiError(400,"only owner can delete")
    }
  await deleteFromCloudinary(video.videoFile, "video");
  await deleteFromCloudinary(video.thumbnail, "image");

  //delete from database
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo) {
    throw new ApiError(400, "video is not deleting from database ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted succesfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404,"video is not found")
  }
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnailPath = req.file?.path;

  const updatedData = {};
  if (title) updatedData.title = title;
  if (description) updatedData.description = description;
  if (thumbnailPath) {
    //delete our previous thumbnail from cloudinary
    await deleteFromCloudinary(video.thumbnail);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if(thumbnail && thumbnail.secure_url){
        updatedData.thumbnail = thumbnail.secure_url
    }
  }
  const updatedVideo = await Video.findByIdAndUpdate(videoId,{
    $set:updatedData
  },{
    new:true
  })
 if(!updatedVideo){
   throw new ApiError(400,"video is not updating ")
 }
  return res
  .status(200)
  .json(new ApiResponse(200,updatedVideo,"video updation done succesfully"))
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId){
      throw new ApiError(400,"videoId is missing")
    }
    const video = await Video.findById(videoId)
    if(!video){
      throw new ApiError(400,"Video is not available")
    }
    if(video.owner.toString() !== req.user._id.toString()){
      throw new ApiError(400,"only owner can change the status")
    }
   video.isPublished = !video.isPublished;
   await video.save({ validateBeforeSave: false });
   return res
   .status(200)
   .json(new ApiResponse(200,video,"publish status change succesfully"))
})


const getAllVideosPublic = asyncHandler(async(req,res)=>{
   const { page = 1,limit=10,query,sortBy,sortType,userId} = req.query;
   const pageNumber = Number(page)
   const limitNumber = Number(limit);
   const matchStage= {}
   if(query){
    matchStage.$or= [
        {title:{$regex:query,$options:"i"}},
        {description:{$regex:query,$options:"i"}}
    ]
 }
  matchStage.isPublished = true;
  const sortStage = {}
  if(sortBy){
    sortStage[sortBy] = sortType === 'asc' ? 1:-1;
  }else{
    sortStage.createdAt = -1
  }

  const aggregationPipeline = [
    {
      $match:matchStage
    },
    {
      $sort: sortStage
    },
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[
          {
            $project:{
              fullName:1,
              userName:1,
              avatar:1
            }
          }
        ]
      }
    },
    {
      $unwind:{path:"$owner",preserveNullAndEmptyArrays:true}
    }
  ];
  const options={
    page:pageNumber,
    limit:limitNumber
  }

  const video = await Video.aggregatePaginate(
    Video.aggregate(aggregationPipeline),
    options
  )

    return res
     .status(200)
     .json(new ApiResponse(200,video,"fetched all video succesfully public "))

   })
export { publishshVideo, getVideoById, deleteVideoById, updateVideo,getAllVideos,togglePublishStatus ,getAllVideosPublic};
