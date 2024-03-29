import { RequestHandler, Router } from 'express';
import { RouteBuilder } from './route-builder.js';
import { HTTPMethod, Route } from './types.js';
import { convertPathToOpenAPIFormat } from "./utils.js";
import { AJV, AJVInstance } from './schema-helpers.cjs';
export { HTTPMethod } from './types.js';

const compileRoute = <InjectedContext>(route: Route<any, any>, injectedContext: InjectedContext): RequestHandler => {
  return async (req, res, next) => {
    try {
      const injectedValues = injectedContext ?? {};

      for (const middleware of route.middlewares) {
        Object.assign(injectedValues, await middleware(req, injectedValues));
      }

      const response = await route.handler(injectedValues, req);
      if (response) {
        res.send(response);
      } else {
        res.status(204).send();
      }
    } catch (error) {
      next(error);
    }
  };
}

export class Rototill<InjectedContext = object> {
  private _routes: Route<any, any>[];
  private queryAjv: AJVInstance;
  private paramAjv: AJVInstance;
  private bodyAjv: AJVInstance;
  private children: Map<string, Rototill<InjectedContext>>;

  constructor(
    paramAjv: AJVInstance | null = null,
    bodyAjv: AJVInstance | null = null,
    queryAjv: AJVInstance | null = null
  ) {
    this._routes = [];
    this.paramAjv = paramAjv ?? new AJV({
      coerceTypes: true,
    });

    this.queryAjv = queryAjv ?? new AJV({
      coerceTypes: true,
    });

    this.bodyAjv = bodyAjv ?? new AJV();

    this.children = new Map();
  }

  static from<InjectedContext>(children: Map<string, Rototill<InjectedContext>>): Rototill<InjectedContext> {
    const root = new Rototill<InjectedContext>();
    root.children = children;
    return root;
  }

  createRoute(
    method: HTTPMethod,
    path: string,
    builderFunc: ((routeBuilder: RouteBuilder<{ context: InjectedContext }>) => Route<any, unknown>)
  ): Rototill<InjectedContext> {
    const route = builderFunc(RouteBuilder.new(this.paramAjv, this.queryAjv, this.bodyAjv, method, path));
    this._routes.push(route);

    return this;
  }

  createPath(path: string): Rototill<InjectedContext> {
    const newChild = new Rototill<InjectedContext>(this.paramAjv, this.bodyAjv);
    this.children.set(path, newChild);
    return newChild;
  }

  routes(injectedContext: InjectedContext | undefined = undefined): Router {
    const router = Router();
    for (const route of this._routes) {
      router[route.method](route.path, compileRoute(route, { context: injectedContext }));
    }

    for (const [childPath, child] of this.children.entries()) {
      router.use(childPath, child.routes(injectedContext));
    }

    return router;
  }  

  private _getAllRoutesWithPreifx(pathPrefix: string, accum: Route<any, any>[] = []): Route<any, any>[] {
    for (const route of this._routes) {
      accum.push({
        ...route,
        path: convertPathToOpenAPIFormat(pathPrefix + route.path),
      })
    }

    for (const [childPath, child] of this.children.entries()) {
      child._getAllRoutesWithPreifx(pathPrefix + childPath, accum);
    }

    return accum;
  }

  generateOpenAPISpec(pathPrefix = "/", apiInfo: {
    name?: string,
    version?: string,
  }) {
    const res = this._getAllRoutesWithPreifx(pathPrefix)
      .reduce((accum, route) => {
        const fullPath = route.path;
        if (!accum[fullPath]) {
          accum[fullPath] = {};
        }

        const def: any = {
          operationId: route.path,
          parameters: [],
          responses: {},
        };

        if (route.paramSchema) {
          def.parameters = Object.entries(route.paramSchema.properties ?? {}).map(([param, paramSchema]) => {
            return {
              name: param,
              in: 'path',
              required: true,
              schema: paramSchema,
            };
          });
        }

        if (route.bodySchema) {
          def.requestBody = {
            content: {
              'application/json': {
                schema: route.bodySchema,
              },
            },
            required: true,
          };
        }

        if (route.outputSchema) {
          def.responses['200'] = {
            content: {
              'application/json': {
                schema: route.outputSchema,
              },
            },
          };
        }

        accum[fullPath][route.method.toLocaleLowerCase()] = def;
        return accum;
      }, {} as any);

    return {
      openapi: '3.0.1',
      info: {
        title: apiInfo.name,
        version: apiInfo.version,
      },
      paths: res,
    };
  }
}
