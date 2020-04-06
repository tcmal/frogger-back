import {Entity, model, property, hasMany} from '@loopback/repository';

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

  constructor(data?: Partial<Comment>) {
    super(data);
  }
}

export interface CommentRelations {
  // describe navigational properties here
  replies: Comment[]
}

export type CommentWithRelations = Comment & CommentRelations;
