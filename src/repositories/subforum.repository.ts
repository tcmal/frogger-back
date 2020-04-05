import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Subforum, SubforumRelations, Post, Subscription} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {PostRepository} from './post.repository';
import {SubscriptionRepository} from './subscription.repository';

export class SubforumRepository extends DefaultCrudRepository<
  Subforum,
  typeof Subforum.prototype.name,
  SubforumRelations
> {

  public readonly posts: HasManyRepositoryFactory<Post, typeof Subforum.prototype.name>;

  public readonly subscriptions: HasManyRepositoryFactory<Subscription, typeof Subforum.prototype.name>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('PostRepository') protected postRepositoryGetter: Getter<PostRepository>, @repository.getter('SubscriptionRepository') protected subscriptionRepositoryGetter: Getter<SubscriptionRepository>,
  ) {
    super(Subforum, dataSource);
    this.subscriptions = this.createHasManyRepositoryFactoryFor('subscriptions', subscriptionRepositoryGetter,);
    this.posts = this.createHasManyRepositoryFactoryFor('posts', postRepositoryGetter,);
    this.registerInclusionResolver('posts', this.posts.inclusionResolver);
  }

}
