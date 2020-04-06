import {Entity, model, property, hasMany} from '@loopback/repository';
import {Post} from './post.model';
import {Subscription} from './subscription.model';

@model()
export class Subforum extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
    jsonSchema: {
      minLength: 4,
      maxLength: 24,
      pattern: '^[A-z0-9\-_]+$',
      errorMessage: 'Sub name should be 4-24 alphanumeric characters.'
    }
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    default: "A subforum.",
    jsonSchema: {
      minLength: 10,
      maxLength: 500,
      errorMessage: 'Sub description should be 10-500 characters.'
    }
  })
  description: string;

  @property({
    type: 'string',
    required: true,
  })
  ownerName: string;

  @hasMany(() => Post, {keyTo: 'postedTo'})
  posts: Post[];

  @hasMany(() => Subscription, {keyTo: 'subName'})
  subscriptions: Subscription[];

  constructor(data?: Partial<Subforum>) {
    super(data);
  }
}

export interface SubforumRelations {
  // describe navigational properties here
}

export type SubforumWithRelations = Subforum & SubforumRelations;
