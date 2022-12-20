import {Rototill, HTTPMethod, AsyncRouteMiddleware} from '../src/index.js';
import { JSONSchemaType } from 'ajv';
import {ServerContext} from './types.js';
import {Product} from './model.js';

export const usersApi = new Rototill<ServerContext>();

type IdParamsSchema = {
  id: string,
};

const idSchema: JSONSchemaType<IdParamsSchema> = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
    },
  },
}

usersApi
  .createRoute(HTTPMethod.Get, '/:id', builder => 
    builder
      .params(idSchema)
      .handler(({ params }) => {
        return {
          id: params.id,
        };
      })
  )

const friendsApi = usersApi.createPath('/:userId/friends')

type FriendIdParamsSchema = {
  userId: string,
  friendId: string,
};

const friendIdSchema: JSONSchemaType<FriendIdParamsSchema> = {
  type: 'object',
  required: ['userId', 'friendId'],
  properties: {
    userId: {
      type: 'string',
    },
    friendId: {
      type: 'string',
    },
  },
}

friendsApi.createRoute(HTTPMethod.Get, '/:friendId', builder => 
  builder
    .params(friendIdSchema)
    .handler(({ params }) => {
      return {
        userId: params.userId,
        friendId: params.friendId,
      }
    }))
