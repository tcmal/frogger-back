import {
  Count,
  CountSchema,
  repository,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  post,
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';
import {Subscription, Subforum, Post, PostWithVotes} from '../models';
import {PostRepository, PostVoteRepository, UserRepository, SubforumRepository, SubscriptionRepository} from '../repositories';
import {LOGGED_IN} from '../spec';

export class UserSubscriptionController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
    @repository(PostVoteRepository) protected postVoteRepository: PostVoteRepository,
    @repository(PostRepository) protected postRepository: PostRepository,
    @repository(SubscriptionRepository) protected subscriptionRepository: SubscriptionRepository,
    @repository(SubforumRepository) protected subforumRepository: SubforumRepository,
  ) { }

  @get('/me/home', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'Posts from the subscriptions of the logged in user',
        content: {
          'application/json': {
            schema: {type: 'array', items: {
              ...getModelSchemaRef(Post),
              votesExclUser: 'number',
              userVote: {
                isUpvote: 'boolean',
              },
            }},
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async userHome(
    @inject(SecurityBindings.USER)
    profile: UserProfile,
    @param.query.number('limit', {default: 20}) limit: number,
    @param.query.dateTime('after') after?: Date,
  ): Promise<PostWithVotes[]> {
    // Names of subscribed subs
    const subscriptions = (await this.subscriptionRepository.find({
      where: {
        userName: profile[securityId],
      },
    })).map(x => x.subName);

    // Get posts from those subs
    const posts = await this.postRepository.find({
      where: {
        postedTo: {inq: subscriptions},
        createdAt: after ? {lt: after} : undefined
      },
      limit,
      order: ['createdAt DESC']
    });

    // Get votes for those comments
    const postsWithComments = Promise.all(posts.map(p => p.withUserVote(this.postVoteRepository, profile)));

    return postsWithComments;
  }  

  @get('/me/relations', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'A list of the subscriptions and owned subreddits of the logged-in user',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Subforum)},
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @inject(SecurityBindings.USER)
    profile: UserProfile,
    @param.query.number('limit', {default: 20}) limit: number,
    @param.query.string('after') after?: string,
  ): Promise<Subforum[]> {
    // Owned subs
    const owned = await this.subforumRepository.find({
      where: {
        ownerName: profile[securityId],
        name: after ? {gt: after} : undefined
      },
      order: ['name ASC'],
      limit: limit
    });

    // Names of subscribed subs
    const subscriptions = (await this.subscriptionRepository.find({
      where: {
        userName: profile[securityId],
        subName: after ? {gt: after} : undefined
      },
      order: ['subName ASC'],
      limit: limit - owned.length,
    })).map(x => x.subName);

    // Full subscription details, also filter out owned to avoid duplicates
    const subscribedTo = await this.subforumRepository.find({
      where: {
        name: {inq: subscriptions},
        ownerName: {neq: profile[securityId]},
      },
      order: ['name ASC']
    });

    // Merge the two together, maintaining sort order
    const merged = [];
    let ownedIdx = 0, subsIdx = 0;
    while (merged.length < (owned.length + subscribedTo.length)) {
      if (ownedIdx >= owned.length) {
        merged.push(subscribedTo[subsIdx]);
        subsIdx++;
      } else if (subsIdx >= subscribedTo.length){
        merged.push(owned[ownedIdx]);
        ownedIdx++;
      } else if (owned[ownedIdx].name >= subscribedTo[subsIdx].name) {
        merged.push(subscribedTo[subsIdx]);
        subsIdx++;
      } else {
        merged.push(owned[ownedIdx]);
        ownedIdx++;
      }
    }

    return merged;
  }

  @post('/sub/{id}/subscribe', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(Subscription)}},
      },
    },
  })
  @authenticate('jwt')
  async create(
    @param.path.string('id') subName: string,
    @inject(SecurityBindings.USER) profile: UserProfile,
  ): Promise<Subscription> {
    return this.subscriptionRepository.create({
      userName: profile[securityId],
      subName,
      compoundKey: profile[securityId] + '|' + subName
    });
  }

  @del('/sub/{id}/unsubscribe', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'User.Subscription DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async delete(
    @param.path.string('id') subName: string,
    @inject(SecurityBindings.USER) profile: UserProfile,
  ): Promise<Count> {
    return this.userRepository.subscriptions(profile.id).delete({subName});
  }
}
