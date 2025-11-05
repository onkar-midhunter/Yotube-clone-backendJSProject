import dotenv from "dotenv";
// Configure dotenv before other imports
const envResult = dotenv.config({
  path: "./.env"
});

if (envResult.error) {
  console.error("Error loading .env file:", envResult.error);
  process.exit(1);
}

// Verify required environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

//when we connect database always use try catch and async await
import express from "express";
import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 3000;
connectDB()
.then(()=>{
   app.listen(PORT,()=>{
    console.log(`App is listening on ${PORT}`);
    
   })
})
.catch((err)=>{
  console.log("MONGO DB connection failed");
  
})






















/*
const app = express()
;(async()=>{
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error",(error)=>{
      console.log("Err:",error);
      throw error
      
    })
    app.listen(process.env.PORT , ()=>{
      console.log(`app is listening on ${process.env.PORT}`);
      
    })
  } catch (error) {
    console.log("error:",error);
    throw error;
    
  }
})() 
*/
