import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {Post, PostRelations, Subforum} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {SubforumRepository} from './subforum.repository';

export class PostRepository extends DefaultCrudRepository<
  Post,
  typeof Post.prototype.id,
  PostRelations
> {

  public readonly subforum: BelongsToAccessor<Subforum, typeof Post.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('SubforumRepository') protected subforumRepositoryGetter: Getter<SubforumRepository>,
  ) {
    super(Post, dataSource);
    this.subforum = this.createBelongsToAccessorFor('subforum', subforumRepositoryGetter,);
    this.registerInclusionResolver('subforum', this.subforum.inclusionResolver);
  }
}
