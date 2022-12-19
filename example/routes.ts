import {Rototill, HTTPMethod, AsyncRouteMiddleware} from '../src/index.js';
import { JSONSchemaType } from 'ajv';
import {ServerContext} from './types.js';
import {Product} from './model.js';

export const productsApi = new Rototill<ServerContext>();

type ProductIdParamsSchema = {
  id: string,
};

const productIdSchema: JSONSchemaType<ProductIdParamsSchema> = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
    },
  },
}

const fetchProductMidleware: AsyncRouteMiddleware<{ context: ServerContext, params: ProductIdParamsSchema }, { product: Product | null }> = async (_, { context, params }) => {
  return {
    product: await context.productLoader(params.id)
  };
};

productsApi
  .createRoute(HTTPMethod.Post, '/:id', builder => 
    builder
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
          name: body.name,
        };
      })
  )
  .createRoute(HTTPMethod.Get, '/:id', builder => 
    builder
      .params(productIdSchema)
      .addAsyncMiddleware(fetchProductMidleware)
      .handler(({ params, product }) => {
        return {
          id: params.id,
          name: product?.name,
        };
      })
  )
