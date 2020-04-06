import {Entity, model, property} from '@loopback/repository';

@model()
export class CommentVote extends Entity {
  @property({
    type: 'number',
    required: true,
  })
  commentId: number;

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


  constructor(data?: Partial<CommentVote>) {
    super(data);
  }
}

export interface CommentVoteRelations {
  // describe navigational properties here
}

export type CommentVoteWithRelations = CommentVote & CommentVoteRelations;
