import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {Subscription, SubscriptionRelations, Subforum} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {SubforumRepository} from './subforum.repository';

export class SubscriptionRepository extends DefaultCrudRepository<
  Subscription,
  typeof Subscription.prototype.compoundKey,
  SubscriptionRelations
> {

  public readonly subforum: BelongsToAccessor<Subforum, typeof Subscription.prototype.compoundKey>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('SubforumRepository') protected subforumRepositoryGetter: Getter<SubforumRepository>,
  ) {
    super(Subscription, dataSource);
    this.subforum = this.createBelongsToAccessorFor('subforum', subforumRepositoryGetter,);
  }
}
