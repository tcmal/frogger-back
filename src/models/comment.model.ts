import {Entity, model, property, hasMany} from '@loopback/repository';
import {CommentVote} from './comment-vote.model';
import {CommentVoteRepository} from '../repositories';

import {UserProfile, securityId} from '@loopback/security';

@model()
export class Comment extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  userName: string;

  @property({
    type: 'number',
    required: true,
  })
  postId: number;

  @property({
    type: 'number',
  })
  replyTo?: number;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  commentId?: number;

  @property({
    type: 'string',
    required: true,
  })
  content: string;

  @property({
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  createdAt: Date;

  @hasMany(() => Comment, {keyTo: 'replyTo'})
  replies: Comment[];

  @hasMany(() => CommentVote)
  votes: CommentVote[];

  constructor(data?: Partial<Comment>) {
    super(data);
  }

  async withUserVote(repo: CommentVoteRepository, profile?: UserProfile): Promise<CommentWithRelations> {
    let name = profile ? profile[securityId] : undefined;

    const upvotes = await repo.count({
      commentId: this.commentId,
      isUpvote: true,
    });

    const downvotes = await repo.count({
      commentId: this.commentId,
      isUpvote: false,
    });
    let votesExclUser = upvotes.count - downvotes.count;
    
    let userVote = undefined;
    if (profile) {
      userVote = await repo.findOne({
        where: {
          commentId: this.commentId,
          userName: profile[securityId],
        }
      });

      if (userVote) {
        votesExclUser += userVote.isUpvote ? -1 : 1;
      }
    }

    return {
      ...this,
      votesExclUser,
      userVote,
    } as CommentWithRelations;
  }
}

export interface CommentRelations {
  // describe navigational properties here
  replies: Comment[],

  votesExclUser: number,
  userVote?: CommentVote
}

export type CommentWithRelations = Comment & CommentRelations;
