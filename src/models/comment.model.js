import mongoose, { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
  content:{
    type:String,
    required:true
  },
  video:{
    type:mongoose.Types.ObjectId,
    ref:"Video"
  },
  owner:{
    type:mongoose.Types.ObjectId,
    ref:"User"
  },
  parentComment:{
    type:mongoose.Types.ObjectId,
    ref:"Comment"
  }
},{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = model("Comment",commentSchema)