import { useLocation, useNavigate } from '@remix-run/react'
import React from 'react'
import { PostCardModel } from '../types'

export function usePostClickHandler(post: PostCardModel) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target instanceof HTMLAnchorElement) return

    //TODO:
    if (
      !post.person.handle ||
      !post.id ||
      post.deleted ||
      `/profile/${post.person.handle}/status/${post.id}` === location.pathname
    )
      return
    navigate(`/profile/${post.person.handle}/status/${post.id}`)
  }

  return handleClick
}
