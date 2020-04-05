import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Subforum} from './subforum.model';

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

  constructor(data?: Partial<Post>) {
    super(data);
  }
}

export interface PostRelations {
  // describe navigational properties here
}

export type PostWithRelations = Post & PostRelations;
