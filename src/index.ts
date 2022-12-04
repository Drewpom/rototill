import { JSONSchemaType } from 'ajv';
import { IncomingHttpHeaders } from 'http';
import { Request, Response, RequestHandler } from 'express';
import { RouteBuilder } from './route-builder.js';
import { HTTPMethod } from './types.js';
export { HTTPMethod } from './types.js';

// const buildHandler = <Params extends void | {}, Body extends void | {}>(route: Route<Params, Body>): RequestHandler<any> => {
//   const validateBody = route.bodySchema ? ajv.compile(route.bodySchema) : undefined;
//   const assertBody = (data: unknown): Body => {
//     if (validateBody) {
//       if (!validateBody(data)) {
//         throw new ValidationError(validateBody.errors!);
//       }
//     }

//     return data as Body;
//   };

//   const validateParams = endpoint.paramsSchema ? ajv.compile(endpoint.paramsSchema) : undefined;
//   const assertParams = (data: unknown): Params => {
//     if (validateParams) {
//       if (!validateParams(data)) {
//         throw new ValidationError(validateParams.errors!);
//       }
//     }

//     return data as Params;
//   };

//   return async (req, res, next) => {
//     try {
//       const body: Body = assertBody(req.body);
//       const params: Params = assertParams(req.params);

//       const output = await route.handler({
//         params,
//         body,
//         headers: req.headers,
//       });
//       return res.send(output || {});
//     } catch (error) {
//       return next(error);
//     }
//   };
// };

export class Rototill {
  private routes: any[];

  constructor() {
    this.routes = [];
  }

  createRoute(method: HTTPMethod, path: string): RouteBuilder {
    const route = RouteBuilder.fromMethodAndPath(method, path);
    this.routes.push(route);

    return route;
  }


}

export const Greeter = (name: string) => `Hello ${name}`; 
