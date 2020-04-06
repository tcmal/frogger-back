import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    hiddenProperties: ["compoundKey"]
  }
})
export class PostVote extends Entity {
  @property({
    type: 'number',
    required: true,
  })
  postId: number;

  @property({
    type: 'string',
    required: true,
  })
  userName: string;

  @property({
    type: 'boolean',
    required: true,
  })
  isUpvote: boolean;

  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  compoundKey: string;

  constructor(data?: Partial<PostVote>) {
    super(data);
  }
}

export interface PostVoteRelations {
  // describe navigational properties here
}

export type PostVoteWithRelations = PostVote & PostVoteRelations;
