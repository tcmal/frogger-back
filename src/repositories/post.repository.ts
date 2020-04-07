import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {Post, PostWithSub, Subforum, PostVote, Comment} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {SubforumRepository} from './subforum.repository';
import {PostVoteRepository} from './post-vote.repository';
import {CommentRepository} from './comment.repository';

export class PostRepository extends DefaultCrudRepository<
  Post,
  typeof Post.prototype.id,
  PostWithSub
> {

  public readonly subforum: BelongsToAccessor<Subforum, typeof Post.prototype.id>;

  public readonly votes: HasManyRepositoryFactory<PostVote, typeof Post.prototype.id>;

  public readonly comments: HasManyRepositoryFactory<Comment, typeof Post.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('SubforumRepository') protected subforumRepositoryGetter: Getter<SubforumRepository>, @repository.getter('PostVoteRepository') protected postVoteRepositoryGetter: Getter<PostVoteRepository>, @repository.getter('CommentRepository') protected commentRepositoryGetter: Getter<CommentRepository>,
  ) {
    super(Post, dataSource);
    this.comments = this.createHasManyRepositoryFactoryFor('comments', commentRepositoryGetter,);
    this.registerInclusionResolver('comments', this.comments.inclusionResolver);
    this.votes = this.createHasManyRepositoryFactoryFor('votes', postVoteRepositoryGetter,);
    this.subforum = this.createBelongsToAccessorFor('subforum', subforumRepositoryGetter,);
    this.registerInclusionResolver('subforum', this.subforum.inclusionResolver);
  }
}
