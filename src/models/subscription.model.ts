import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Subforum} from './subforum.model';

@model({
  settings: {
    hiddenProperties: ['compoundKey']
  }
})
export class Subscription extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  userName: string;
  @property({
    type: 'string',
    id: true,
    required: true,
    generated: false,
  })
  compoundKey: string;

  @belongsTo(() => Subforum, {name: 'subforum'})
  subName: string;

  constructor(data?: Partial<Subscription>) {
    super(data);
  }
}

export interface SubscriptionRelations {
  // describe navigational properties here
}

export type SubscriptionWithRelations = Subscription & SubscriptionRelations;
