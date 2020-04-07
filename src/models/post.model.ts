import {DefaultCrudRepository} from '@loopback/repository';
import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {UserProfile, securityId} from '@loopback/security';

import {PostVoteRepository} from '../repositories/'
import {Subforum} from './subforum.model';
import {PostVote, PostVoteRelations} from './post-vote.model';
import {Comment} from './comment.model';

@model()
export class Post extends Entity {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 4,
      maxLength: 500
    }
  })
  title: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isLink: boolean;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 4,
      maxLength: 10000
    }
  })
  content: string;
  @property({
    type: 'string',
    required: true,
  })
  postedBy: string;

  @property({
    type: 'date',
    required: true,
    default: () => new Date()
  })
  createdAt: Date;

  @belongsTo(() => Subforum, {name: 'subforum'})
  postedTo: string;

  @hasMany(() => PostVote)
  votes: PostVote[];

  @hasMany(() => Comment)
  comments: Comment[];

  constructor(data?: Partial<Post>) {
    super(data);
  }

  async withUserVote(postVoteRepository: DefaultCrudRepository<
      PostVote,
      typeof PostVote.prototype.compoundKey,
      PostVoteRelations
    >, profile: UserProfile): Promise<PostWithVotes> {
    let name = profile[securityId] ? profile[securityId] : undefined;

    const upvotes = await postVoteRepository.count({
      postId: this.id,
      isUpvote: true,
    });

    const downvotes = await postVoteRepository.count({
      postId: this.id,
      isUpvote: false,
    });
    let votesExclUser = upvotes.count - downvotes.count;
    
    let userVote = undefined;
    if (name) {
      userVote = await postVoteRepository.findOne({
        where: {
          postId: this.id,
          userName: name,
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
    } as PostWithVotes;
  }
}

export interface PostVotes {
  // describe navigational properties here
  votesExclUser: number,
  userVote?: PostVote,
}

export type PostWithVotes = Post & PostVotes;

export interface PostSub {
  subforum: Subforum
}

export type PostWithSub = Post & PostSub;