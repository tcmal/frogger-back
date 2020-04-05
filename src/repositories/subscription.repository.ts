import {DefaultCrudRepository} from '@loopback/repository';
import {Subscription, SubscriptionRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class SubscriptionRepository extends DefaultCrudRepository<
  Subscription,
  typeof Subscription.prototype.compoundKey,
  SubscriptionRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Subscription, dataSource);
  }
}
