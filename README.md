# Rototill
A route building utility for Express to help with validation, typings, and OpenAPI specs for REST APIs

## Motivation
I wanted a light-weight way to have type-checked Express routes. [tsoa](https://github.com/lukeautry/tsoa) is a great library that achieves the same goal, however, the use of code generation added an extra build and development step that I wanted to avoid.

## Usage
Rototill exports a single `Rototill` class that can be used to build any number of routes. You can create multiple instances of `Rototill` for different sections of your API or you can use one single instance.

Example:
```
// A route builder
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

// Main app entry point
const app = express()
const port = 3000

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/products', productsApi.routes());
```

### Dependency Injection
Context for all routes can be injected when building the Express router. This is useful for injecting services during server creation. The value injected to the `routes` method will be available in the route handler and all middleware as `{ context: "your value" }`

```

export type ServerContext = {
  productLoader(productId: string): Promise<Product | null>,
};

// A route builder
import {Rototill, HTTPMethod} from '../src/index.js';
import { JSONSchemaType } from 'ajv';

export const productsApi = new Rototill<ServerContext>();

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
      .handler(async ({ params, body, context }) => {
        const product = await context.productLoader.fetchProduct(params.id);

        return {
          id: params.id,
          name: body.name,
        };
      })
  )

// Main app entry point
const app = express()
const port = 3000

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/products', productsApi.routes({
  async productLoader(productId) {
    return fetchProduct(productId);
  },
}));

```
