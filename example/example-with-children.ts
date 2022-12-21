import {Rototill, HTTPMethod} from '../src/index.js';
import { JSONSchemaType } from 'ajv';
import {ServerContext} from './types.js';

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

const outputSchema: JSONSchemaType<{
  id: string,
  name: string,
}> = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    }
  },
}

usersApi
  .createRoute(HTTPMethod.Get, '/:id', builder => 
    builder
      .params(idSchema)
      .output(outputSchema)
      .handler(({ params }) => {
        return {
          id: params.id,
          name: 'test',
        };
      })
  )

const friendsApi = usersApi.createPath('/:userId/friends')

type FriendIdParamsSchema = {
  friendId: number,
};

const friendIdSchema: JSONSchemaType<FriendIdParamsSchema> = {
  type: 'object',
  required: ['friendId'],
  properties: {
    friendId: {
      type: 'integer',
    },
  },
}

friendsApi.createRoute(HTTPMethod.Get, '/:friendId', builder => 
  builder
    .params(friendIdSchema)
    .handler(({ params }) => {
      return {
        friendId: params.friendId,
      }
    }))
