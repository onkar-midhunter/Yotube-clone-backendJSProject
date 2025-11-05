 export const extractPublicId = (url)=>{
  return url.split("/").pop().split(".")[0];
}

