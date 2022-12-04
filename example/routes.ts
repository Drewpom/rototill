import {Rototill, HTTPMethod} from '../src/index.js';
import { JSONSchemaType } from 'ajv';

export const productsApi = new Rototill();

const productIdSchema: JSONSchemaType<{
  id: string,
}> = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
    },
  },
}

productsApi
  .createRoute(HTTPMethod.Put, '/products/:id')
  .params(productIdSchema)
  .body<{
    name: string,
  }>({
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
      },
    },
  })
  .handler(({ params, body }) => {
    return {
      id: params.id,
    }
  })
