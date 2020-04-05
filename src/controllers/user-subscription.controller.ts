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
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Subscription} from '../models';
import {UserRepository, SubforumRepository} from '../repositories';
import {LOGGED_IN} from '../spec';

export class UserSubscriptionController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
    @repository(SubforumRepository) protected subforumRepository: SubforumRepository,
  ) { }

  @get('/me/relations', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'A list of the subscriptions and owned subreddits of the logged-in user',
        content: {
          'application/json': {
            schema: {
              owned: {type: 'array', items: 'string'},
              subscriptions: {type: 'array', items: 'string'},
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<{owned: string[], subscriptions: string[]}> {
    return {
      owned: (await this.subforumRepository.find({where: {ownerName: profile.id}})).map(x => x.name),
      subscriptions: (await this.userRepository.subscriptions(profile.id).find()).map(x => x.subName),
    };
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
    return this.userRepository.subscriptions(profile.id).create({
      subName,
      compoundKey: profile.id + '|' + subName
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
