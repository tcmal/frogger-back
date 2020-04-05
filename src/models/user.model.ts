import {Entity, model, property, hasMany} from '@loopback/repository';
import {Post} from './post.model';
import {Subscription} from './subscription.model';

@model({
  settings: {
    hiddenProperties: ['password']
  }
})
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
    jsonSchema: {
      maxLength: 24,
      minLength: 4,
      pattern: '^[A-z0-9\-_]+$',
      errorMessage: "Username should be between 4 and 24 alphanumeric characters",
    }
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    generated: false
  })
  password: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      type: 'email'
    }
  })
  email?: string;

  @property({
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  createdAt: Date;

  @hasMany(() => Post, {keyTo: 'posted_by'})
  posts: Post[];

  @hasMany(() => Subscription, {keyTo: 'user_name'})
  subscriptions: Subscription[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;

export type Credentials = {
  username: string;
  password: string;
}
