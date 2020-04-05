import {Entity, model, property} from '@loopback/repository';

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
    required: true,
  })
  subName: string;

  @property({
    type: 'string',
    id: true,
    required: true,
    generated: false,
  })
  compoundKey: string;

  constructor(data?: Partial<Subscription>) {
    super(data);
  }
}

export interface SubscriptionRelations {
  // describe navigational properties here
}

export type SubscriptionWithRelations = Subscription & SubscriptionRelations;
