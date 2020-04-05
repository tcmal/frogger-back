import {
  repository,
} from '@loopback/repository';
import {inject} from '@loopback/context';
import {
  get,
  getModelSchemaRef,
  param,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Subforum,
  Post,
} from '../models';
import {SubforumRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile} from '@loopback/security';

export class SubforumPostController {
  constructor(
    @repository(SubforumRepository) protected subforumRepository: SubforumRepository,
  ) { }

  @get('/subs/{id}/posts', {
    responses: {
      '200': {
        description: 'Array of posts to the given subforum, sorted by created_at',
        content: {
          'application/json': {
            schema: {
              subforum: getModelSchemaRef(Subforum),
              posts: {type: 'array', items: getModelSchemaRef(Post)},
            },
          },
        },
      },
    },
  })
  async subPosts(
    @param.path.string('id') id: string,
    @param.query.number('limit', {default: 20}) limit: number,
    @param.query.dateTime('after', {default: new Date(0)}) after?: Date,
  ): Promise<{subforum: Subforum, posts: Post[]}> {
    return {
      subforum: await this.subforumRepository.findById(id),
      posts: await this.subforumRepository.posts(id).find({ where: {createdAt: {gt: after}}, limit })
    };
  }

  @post('/subs/{id}/posts', {
    responses: {
      '200': {
        description: 'Subforum model instance',
        content: {'application/json': {schema: getModelSchemaRef(Post)}},
      },
    },
  })
  @authenticate('jwt')
  async create(
    @param.path.string('id') id: typeof Subforum.prototype.name,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Post, {
            title: 'NewPostInSubforum',
            exclude: ['id', 'postedTo', 'postedBy', 'createdAt'],
          }),
        },
      },
    }) content: Partial<Post>,
    @inject(SecurityBindings.USER)
    profile: UserProfile
  ): Promise<Post> {
    return this.subforumRepository.posts(id).create({
      ...content,
      postedTo: id,
      postedBy: profile.name,
    });
  }
}
