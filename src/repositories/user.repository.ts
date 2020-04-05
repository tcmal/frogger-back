import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {User, UserRelations, Post, Subscription} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {PostRepository} from './post.repository';
import {SubscriptionRepository} from './subscription.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.name,
  UserRelations
> {

  public readonly posts: HasManyRepositoryFactory<Post, typeof User.prototype.name>;

  public readonly subscriptions: HasManyRepositoryFactory<Subscription, typeof User.prototype.name>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('PostRepository') protected postRepositoryGetter: Getter<PostRepository>, @repository.getter('SubscriptionRepository') protected subscriptionRepositoryGetter: Getter<SubscriptionRepository>,
  ) {
    super(User, dataSource);
    this.subscriptions = this.createHasManyRepositoryFactoryFor('subscriptions', subscriptionRepositoryGetter,);
    this.posts = this.createHasManyRepositoryFactoryFor('posts', postRepositoryGetter,);
    this.registerInclusionResolver('posts', this.posts.inclusionResolver);
  }
}
