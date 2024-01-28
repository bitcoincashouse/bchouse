import moment from '~/server/utils/moment'

export type Activity =
  | ReactionActivity
  | ReplyActivity
  | MentionActivity
  | FollowActivity

export type ActivityData = Activity['activity']

export class ReactionActivity {
  constructor(
    readonly activity: {
      type: 'like' | 'repost' | 'tip'
      actorId: string
      object: {
        postId: string
      }
      timestamp: number
    }
  ) {}

  toKey() {
    return `${this.activity.type}:${this.activity.actorId}:${this.activity.object.postId}`
  }

  static parseKey(key: string, timestamp: number) {
    try {
      const [type, actorId, postId] = key.split(':')
      return type === 'like' || type === 'repost' || type === 'tip'
        ? {
            type: type as 'like' | 'repost' | 'tip',
            actorId: actorId as string,
            object: {
              postId: postId as string,
            },
            timestamp,
          }
        : undefined
    } catch (err) {
      console.log(err, key)
      return undefined
    }
  }

  toGroupKey() {
    const aggDate = moment
      .unix(Math.abs(this.activity.timestamp))
      .format('YYYY-MM-DD')
    return `${this.activity.type}_${aggDate}_${this.activity.object.postId}`
  }
}

export class ReplyActivity {
  constructor(
    readonly activity: {
      type: 'reply'
      actorId: string
      object: {
        postId: string
      }
      data: {
        postId: string
      }
      timestamp: number
    }
  ) {}

  toKey() {
    return `${this.activity.type}:${this.activity.actorId}:${this.activity.object.postId}:${this.activity.data.postId}`
  }

  static parseKey(key: string, timestamp: number) {
    try {
      const [type, actorId, parentPostId, postId] = key.split(':')
      return type === 'reply'
        ? {
            type: type as 'reply',
            actorId: actorId as string,
            object: {
              postId: parentPostId as string,
            },
            data: {
              postId: postId as string,
            },
            timestamp,
          }
        : undefined
    } catch (err) {
      console.log(err, key)
      return undefined
    }
  }

  toGroupKey() {
    return `${this.activity.type}_${this.activity.data.postId}`
  }
}

export class MentionActivity {
  constructor(
    readonly activity: {
      type: 'mention'
      actorId: string
      data: {
        postId: string
      }
      timestamp: number
    }
  ) {}

  toKey() {
    return `${this.activity.type}:${this.activity.actorId}:${this.activity.data.postId}`
  }

  static parseKey(key: string, timestamp: number) {
    try {
      const [type, actorId, postId] = key.split(':')
      return type === 'mention'
        ? {
            type: type as 'mention',
            actorId: actorId as string,
            data: {
              postId: postId as string,
            },
            timestamp,
          }
        : undefined
    } catch (err) {
      console.log(err, key)
      return undefined
    }
  }

  toGroupKey() {
    return `${this.activity.type}_${this.activity.data.postId}`
  }
}

export class FollowActivity {
  constructor(
    readonly activity: {
      type: 'follow'
      actorId: string
      timestamp: number
    }
  ) {}

  toKey() {
    return `${this.activity.type}:${this.activity.actorId}`
  }

  static parseKey(key: string, timestamp: number) {
    try {
      const [type, actorId] = key.split(':')
      return type === 'follow'
        ? {
            type: type as 'follow',
            actorId: actorId as string,
            timestamp,
          }
        : undefined
    } catch (err) {
      console.log(err, key)
      return undefined
    }
  }

  toGroupKey() {
    const aggDate = moment
      .unix(Math.abs(this.activity.timestamp))
      .format('YYYY-MM-DD')
    return `${this.activity.type}_${aggDate}`
  }
}

export class ActivityFactory {
  static create(activityData: ActivityData) {
    if (
      activityData.type === 'like' ||
      activityData.type === 'repost' ||
      activityData.type === 'tip'
    ) {
      return new ReactionActivity(activityData)
    } else if (activityData.type === 'mention') {
      return new MentionActivity(activityData)
    } else if (activityData.type === 'reply') {
      return new ReplyActivity(activityData)
    } else if (activityData.type === 'follow') {
      return new FollowActivity(activityData)
    } else {
      throw new Error('Unexepected activity type: ' + activityData.type)
    }
  }

  static parseKey(key: string, timestamp: number) {
    const [type] = key?.split(':') || []

    if (type === 'like' || type === 'repost' || type === 'tip') {
      return ReactionActivity.parseKey(key, timestamp)
    } else if (type === 'mention') {
      return MentionActivity.parseKey(key, timestamp)
    } else if (type === 'reply') {
      return ReplyActivity.parseKey(key, timestamp)
    } else if (type === 'follow') {
      return FollowActivity.parseKey(key, timestamp)
    } else {
      return undefined
    }
  }
}
