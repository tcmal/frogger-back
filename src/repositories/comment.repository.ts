import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Comment, CommentRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';

export class CommentRepository extends DefaultCrudRepository<
  Comment,
  typeof Comment.prototype.commentId,
  CommentRelations
> {

  public readonly replies: HasManyRepositoryFactory<Comment, typeof Comment.prototype.commentId>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Comment, dataSource);
    this.replies = this.createHasManyRepositoryFactoryFor('replies', Getter.fromValue(this));
    this.registerInclusionResolver('replies', this.replies.inclusionResolver);
  }
}
