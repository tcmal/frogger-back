import {
  repository,
} from '@loopback/repository';
import {
  post,
  getModelSchemaRef,
  del,
  requestBody,
} from '@loopback/rest';
import {User, Credentials} from '../models';
import {UserRepository} from '../repositories';
import {PasswordHasher} from '../services';
import {inject} from '@loopback/core';
import {
  TokenServiceBindings,
  PasswordHasherBindings,
  UserServiceBindings,
} from '../keys';
import {SecurityBindings, UserProfile} from "@loopback/security";
import {UserService, TokenService, authenticate} from "@loopback/authentication";
import {LOGGED_IN} from '../spec/';

type AuthResponse = {
  token: string,
  user: User,
}

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User, Credentials>
  ) {}

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(User, {exclude: ['createdAt']})}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User),
        },
      },
    })
    user: User,
  ): Promise<User> {
    const password = await this.passwordHasher.hashPassword(
      user.password,
    );

    return this.userRepository.create({
      ...user,
      password
    });
  }

  @post('/users/auth', {
    responses: {
      '200': {
        description: 'User model instance and JWT token',
        content: {'application/json': {
          schema: {
            token: 'string',
            user: getModelSchemaRef(User, {exclude: ['password']})
          },
        }}
      }
    }
  })
  async auth(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: {
                type: 'string',
              },
              password: {
                type: 'string',
              }
            }
          }
        }
      }
    }) creds: Credentials,
    ): Promise<AuthResponse> {

    const user = await this.userService.verifyCredentials(creds);

    const profile = this.userService.convertToUserProfile(user);

    const token = await this.tokenService.generateToken(profile);

    return {
      token,
      user
    }
  }

  @del('/users/', {
    title: 'Delete the logged in user',
    security: LOGGED_IN,
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteMe(
    @inject(SecurityBindings.USER) profile: UserProfile,
  ): Promise<void> {
    await this.userRepository.deleteById(profile.id);
  }
}
