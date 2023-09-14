const postHelper = require('../helpers/postHelper');
const postModel = require('../model/postModel');
const scheduleDeletionModel = require('../model/scheduleDeletion'); 
const repostModel = require('../model/respostModel');

module.exports ={

    // ------------------------------------------------------------------ADD POST----------------------------------------------------------------------------
        addPost: async(req,res)=>{
            try {
                const userId = req.userDetails._id;
                const imageUrl = req.body.imageUrl;
                const discription = req.body.discription;
                const postDetails = {userId,imageUrl,discription};
                const createPost = new postModel(postDetails);
                const posted = createPost.save();
                if(!posted) return res.status(404).json({message:"Unable to post your picture"});
                res.status(200).json({message:"Posted Successfully"})
            } catch (error) {
                res.status(500).json({message:"Internal Server Error"})
            }
        },
        
    // ------------------------------------------------------------------ADD COMMENT----------------------------------------------------------------------------

    addComment : async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const commentText = req.body.commentText
            const postId = req.body.postId
            const commentDetails = {userId,commentText}
            const addComment = await postModel.findOneAndUpdate({_id:postId},{$push:{comments:commentDetails}});
            if(!addComment) return res.status(404).json({message:"unable to add comment"})
            res.status(200).json({message:"Comment Added Successfully"})
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Like Comment----------------------------------------------------------------------------

     likeComment: async(req,res)=>{
        try {
            // requiring Values
            const commentId = req.body.commentId;
            const postId = req.body.postId;
            const userId = req.userDetails._id; 
            const likeComment = await postHelper.likeComment(commentId,postId,userId)
            if(likeComment){
                res.status(200).json({message:"comment liked Successfully"})
            }else{
                res.status(401).json({message:"Already like the comment"})
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }
    },


        // ------------------------------------------------------------------Unlike the Comment----------------------------------------------------------------------------

        unlikeComment: async(req,res)=>{
            try {
                // requiring Values
                const commentId = req.body.commentId;
                const postId = req.body.postId;
                const userId = req.userDetails._id; 
                const unlikeComment = await postHelper.unlikeComment(commentId,postId,userId)
                if(unlikeComment){
                    res.status(200).json({message:"comment Unliked Successfully"})
                }else{
                    res.status(401).json({message:"Already Unliked the comment"})
                }
            } catch (error) {
                console.log(error)
                res.status(500).json({message:"Internal Server Error"})
            }
        },

            // ------------------------------------------------------------------Like The Post----------------------------------------------------------------------------

       likePost: async(req,res)=>{
        try {
            const postId = req.body.postId
            const userId = req.userDetails._id
            const likePost = await postModel.findOneAndUpdate({_id:postId,likes:{$ne:userId}},{$addToSet:{likes:userId}})
            if(likePost) return res.status(200).json({message:"You liked this Post"});
            else return res.status(401).json({message:"You have already like this Post"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------UnLike The Post----------------------------------------------------------------------------

        unlikePost: async(req,res)=>{
            try {
                const postId = req.body.postId;
                const userId = req.userDetails._id;
                const unlikePost = await postModel.findOneAndUpdate({_id:postId,likes:userId},{$pull:{likes:userId}});
                if(unlikePost) res.status(200).json({message:"You've Unliked the Post"})
                else return res.status(401).json({message:"You have Already unliked the Post"})
            } catch (error) {
                res.status(500).json({message:"Internal Server Error"})
            }
        },

   // ------------------------------------------------------------------TEMPERORY POST DELETE--------------------------------------------------------------------------

    temperoryPostDelete: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const userId = req.userDetails._id;
            const deletionAlreadyScheduled = await scheduleDeletionModel.findOne({postId:postId});
            if(deletionAlreadyScheduled) return res.status(401).json({message:"You Have already Deleted The Post"})
            const temperoryPostDelete = await postModel.findOneAndUpdate({_id:postId,userId:userId},{$set:{ show:false} });
            const schedulePostDelete = await postHelper.schedulePostDelete(postId,userId);
            if(temperoryPostDelete && schedulePostDelete) return res.status(200).json({message:"Your Post Will be Permenently Deleted After 7 days"});
            else return res.status(401).json({message:'Unable to Delete post'});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

     // ------------------------------------------------------------------------Recover Post------------------------------------------------------------------------------

     recoverPost: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const changeShowStatus = await postModel.findOneAndUpdate({_id:postId},{$set:{show:true}});
            const removeFromDeletionSchedule = await scheduleDeletionModel.deleteOne({postId:postId});
           if(changeShowStatus && removeFromDeletionSchedule) res.status(200).json({message:"Post recovered"});
           else res.status(404).json({message:"Unable to Recover your post"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

     // ------------------------------------------------------------------PERMENENT POST DELETE--------------------------------------------------------------------------

     permenentPostDelete: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const postDeleted = await postModel.findOneAndDelete({_id:postId});
            if(postDeleted) return res.status(200).json({message:"Post Deleted Successfully"});
            else return res.status(401).json({message:"Unable to delete the post"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

     // ------------------------------------------------------------------GET POSTS COUNT-------------------------------------------------------------------------

     getPostCount : async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const postCount = await postModel.find({userId:userId,show:false}).count()
            if(postCount) res.status(200).json({postCount:postCount})
            else res.status(401).json({message:"No Post Found"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

   // ------------------------------------------------------------------GetPostForHomeScreen-------------------------------------------------------------------------

        getPostForHomeScreen: async(req,res)=>{
            try {
                const postsForHomeScreen = await postModel.find({show:true});
                if(postsForHomeScreen) return res.status(200).json({postsForHomeScreen:postsForHomeScreen});
                else return res.status(404).json({message:"No Post available"})
            } catch (error) {
                res.status(500).json({message:"Internal Server Error"});
            }
        },
    
    // ------------------------------------------------------------------GetDeletionScheduledPosts-------------------------------------------------------------------------

    getDeletionScheduledPosts: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const deletionScheduledPosts = await scheduleDeletionModel.find({userId:userId}).populate('postId');
            if(deletionScheduledPosts) res.status(200).json({deletionScheduledPosts:deletionScheduledPosts});
            else res.status(404).json({message:"No Post Available"})
        } catch (error) {
            console.log(error);
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ---------------------------------------------------------------------------Repost-------------------------------------------------------------------------------
    
    repost: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const ownerId = req.body.ownerId;
            const postId = req.body.postId;

            const AlreadyReposted = await repostModel.findOne({postId});
            if(AlreadyReposted) return res.status(404).json({message:"Already Reposted this post"})

            if(userId == ownerId) return res.status(401).json({message:"The User and owner cannot be 1 person"});
            const newRepost = new repostModel({
                userId:userId,
                postId:postId,
                ownerId:ownerId
            }); 
            const reposted = await newRepost.save();
            if(reposted) res.status(200).json({message:"Reposted Successfully"});
            else res.status(404).json({message:"Unable to repost"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

       // ---------------------------------------------------------------------------Get Reposts-------------------------------------------------------------------------------

       getReposts: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const reposts =  await repostModel.find({ userId: userId }).populate('ownerId').populate('postId').exec();
            if(reposts) return res.status(200).json({reposts:reposts});
            else return res.status(404).json({message:"You didn't repost anything"})
        } catch (error) {
            console.log(error);
            res.status(500).json({message:"Internal Server Error"});
        }
    },

        // ---------------------------------------------------------------------------REMOVE Reposts-------------------------------------------------------------------------------
   
        removeRepost: async(req,res)=>{
            try {
                const repostId = req.body.repostId;
                const removePost = await repostModel.findByIdAndDelete({_id:repostId});
                if(removePost) res.status(200).json({message:"Post Removed Successfully"});
                else res.status(404).json({message:"Unable to remove repost"});
            } catch (error) {
                console.log(error)
                res.status(500).json({message:"Internal Server Error"});
            }
        },
    

}