import { createPost } from './createPost'
import { getAllPosts } from './getAllPosts'
import { getPostById } from './getPostById'
import { getPostChildren } from './getPostChildren'
import { getPostParents } from './getPostParents'
import { getAllUserPosts, getAllUserRetweets, getUserFeed } from './getUserFeed'
import { getUserHomeFeed } from './getUserHomeFeed'
import { getAllUserLikes, getUserLikes } from './getUserLikes'
import { getUserMedia } from './getUserMedia'
import { getUserReplies } from './getUserReplies'
import { likePost } from './likePost'
import { reportPost } from './reportPost'
import { repost } from './repost'
import { unlikePost } from './unlikePost'
import { unrepostPost } from './unrepostPost'

export default {
  createPost,
  getAllPosts,
  getAllUserRetweets,
  getAllUserPosts,
  getUserLikes,
  getAllUserLikes,
  getUserReplies,
  getUserMedia,
  getUserFeed,
  getUserHomeFeed,
  getPostById,
  getPostParents,
  getPostChildren,
  likePost,
  unlikePost,
  repost,
  unrepostPost,
  reportPost,
}
