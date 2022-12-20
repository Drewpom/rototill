import Ajv from "ajv"
import { RequestHandler, Router } from 'express';
import { RouteBuilder } from './route-builder.js';
import { HTTPMethod, Route } from './types.js';
export { HTTPMethod } from './types.js';

const compileRoute = <InjectedContext>(route: Route<any, any>, injectedContext: InjectedContext): RequestHandler => {
  return async (req, res, next) => {
    console.log('req.params', req.path)
    try {
      const injectedValues = injectedContext ?? {};

      for (let middleware of route.middlewares) {
        Object.assign(injectedValues, await middleware(req, injectedValues));
      }

      const response = await route.handler(injectedValues, req);
      res.send(response);
    } catch (error) {
      next(error);
    }
  };
}

export class Rototill<InjectedContext = {}> {
  private _routes: Route<any, any>[];
  private ajv: Ajv.default;
  private children: Map<string, Rototill<InjectedContext>>;

  constructor(ajv: Ajv.default = new Ajv.default()) {
    this._routes = [];
    this.ajv = ajv;
    this.children = new Map();
  }

  createRoute(
    method: HTTPMethod,
    path: string,
    builderFunc: ((routeBuilder: RouteBuilder<{ context: InjectedContext }>) => Route<any, any>)
  ): Rototill<InjectedContext> {
    const route = builderFunc(RouteBuilder.new(this.ajv, method, path));
    this._routes.push(route);

    return this;
  }

  createPath(path: string): Rototill<InjectedContext> {
    const newChild = new Rototill<InjectedContext>(this.ajv);
    this.children.set(path, newChild);
    return newChild;
  };

  routes(injectedContext: InjectedContext | undefined = undefined): Router {
    const router = Router();
    for (let route of this._routes) {
      router[route.method](route.path, compileRoute(route, { context: injectedContext }));
    }

    for (let [childPath, child] of this.children.entries()) {
      router.use(childPath, child.routes(injectedContext));
    }

    return router;
  }  
}

// private generateOpenAPI() {
//   const res = this.apiFactories
//     .map((api) => {
//       if (!api.showInSwagger) {
//         return undefined;
//       }

//       return api.controllers
//         .map((c) => {
//           const controller = c({} as any);
//           return Object.entries(controller.endpoints).reduce((accum, [endpointName, endpoint]) => {
//             const fullPath = api.basePath + controller.basePath + endpoint.path;
//             if (!accum[fullPath]) {
//               accum[fullPath] = {};
//             }

//             const def: any = {
//               operationId: endpointName,
//               parameters: [],
//               responses: {},
//               tags: [api.name],
//             };

//             if (endpoint.params) {
//               def.parameters = Object.entries(endpoint.params.schema.properties ?? {}).map(([param, paramSchema]) => {
//                 return {
//                   name: param,
//                   in: 'path',
//                   required: true,
//                   schema: paramSchema,
//                 };
//               });
//             }

//             if (endpoint.body) {
//               def.requestBody = {
//                 content: {
//                   'application/json': {
//                     schema: endpoint.body.schema,
//                   },
//                 },
//                 required: true,
//               };
//             }

//             if (endpoint.outputSchema) {
//               def.responses['200'] = {
//                 content: {
//                   'application/json': {
//                     schema: endpoint.outputSchema,
//                   },
//                 },
//               };
//             }

//             accum[fullPath][endpoint.method.toLocaleLowerCase()] = def;
//             return accum;
//           }, {});
//         })
//         .reduce((accum, controller) => {
//           return { ...accum, ...controller };
//         }, {});
//     })
//     .filter(Boolean)
//     .reduce((accum, controller) => {
//       return { ...accum, ...controller };
//     }, {});

//   return {
//     openapi: '3.0.1',
//     info: {
//       title: 'Noble',
//       version: pkg.version,
//     },
//     paths: res,
//     tags: this.apiFactories
//       .filter((a) => a.showInSwagger)
//       .map((api) => {
//         return {
//           name: api.name,
//           description: '',
//         };
//       }),
//   };
// }
