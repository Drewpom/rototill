import Ajv from "ajv"
import { RequestHandler, Router } from 'express';
import { RouteBuilder } from './route-builder.js';
import { HTTPMethod, Route, RouteMiddleware } from './types.js';
export { HTTPMethod } from './types.js';

const compileRoute = (route: Route<any, any>): RequestHandler => {
  return async (req, res, next) => {
    try {
      const injectedValues = {};

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

export class Rototill {
  private _routes: Route<any, any>[];
  private ajv: Ajv.default;

  constructor() {
    this._routes = [];
    this.ajv = new Ajv.default();
  }

  createRoute(
    method: HTTPMethod,
    path: string,
    builderFunc: ((routeBuilder: RouteBuilder) => Route<any, any>)
  ): Rototill {
    const route = builderFunc(RouteBuilder.new(this.ajv, method, path));
    this._routes.push(route);

    return this;
  }

  routes(): Router {
    const router = Router();
    for (let route of this._routes) {
      router[route.method](route.path, compileRoute(route));
    }

    return router;
  }  
}
