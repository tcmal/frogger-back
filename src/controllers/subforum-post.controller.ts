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
  PostWithVotes,
  PostVote
} from '../models';
import {SubforumRepository, PostVoteRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';

export class SubforumPostController {
  constructor(
    @repository(SubforumRepository) protected subforumRepository: SubforumRepository,
    @repository(PostVoteRepository) protected postVoteRepository: PostVoteRepository,
  ) { }

  @get('/subs/{id}/posts', {
    responses: {
      '200': {
        description: 'Array of posts to the given subforum, sorted by created_at',
        content: {
          'application/json': {
            schema: {
              subforum: getModelSchemaRef(Subforum),
              posts: {type: 'array', items: {
                  ...getModelSchemaRef(Post),
                  votesExclUser: 'number',
                  userVote: getModelSchemaRef(PostVote, {exclude: ['compoundKey']})
                },
              },
            },
          },
        },
      },
    },
  })
  async subPosts(
    @param.path.string('id') id: string,
    @param.query.number('limit', {default: 20}) limit: number,
    @inject(SecurityBindings.USER, {optional: true})
    profile?: UserProfile,
    @param.query.dateTime('after') after?: Date,
  ): Promise<{subforum: Subforum, posts: PostWithVotes[]}> {
    let posts = await this.subforumRepository.posts(id).find({ where: {createdAt: after ? {gt: after} : undefined}, limit, order: ['createdAt DESC'] });

    const postsWithVotes: PostWithVotes[] = await Promise.all(posts.map(async post => post.withUserVote(this.postVoteRepository, profile)));

    return {
      subforum: await this.subforumRepository.findById(id),
      posts: postsWithVotes
    };
  };

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
