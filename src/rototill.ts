import Ajv from "ajv"
import { RequestHandler, Router } from 'express';
import { RouteBuilder } from './route-builder.js';
import { HTTPMethod, Route } from './types.js';
export { HTTPMethod } from './types.js';

const compileRoute = <InjectedContext>(route: Route<any, any>, injectedContext: InjectedContext): RequestHandler => {
  return async (req, res, next) => {
    try {
      const injectedValues = injectedContext ?? {};

      for (let middleware of route.middlewares) {
        Object.assign(injectedValues, middleware(req, injectedValues));
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

  constructor() {
    this._routes = [];
    this.ajv = new Ajv.default();
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

  routes(injectedContext: InjectedContext | undefined = undefined): Router {
    const router = Router();
    for (let route of this._routes) {
      router[route.method](route.path, compileRoute(route, injectedContext));
    }

    return router;
  }  
}
