import { JSONSchemaType } from 'ajv';
import { IncomingHttpHeaders } from 'http';
import { Request, Response, RequestHandler } from 'express';
import { HTTPMethod, OptionalSchema, MaybePromise, Route } from './types.js';
 
export class RouteBuilder<
  Params extends undefined | {} = undefined,
  Body extends undefined | {} = undefined,
  Output extends undefined | {} = undefined,
> {
  route: Omit<Route<Params, Body, Output>, 'handler'>;

  constructor(route: Omit<Route<Params, Body, Output>, 'handler'>) {
    this.route = route;
  }

  static fromMethodAndPath(method: HTTPMethod, path: string): RouteBuilder<undefined, undefined, undefined> {
    return new RouteBuilder({
      method,
      path,
      paramsSchema: undefined,
      bodySchema: undefined,
      outputSchema: undefined,
    })
  }

  params<NewParams extends undefined | {}>(params: OptionalSchema<NewParams>): RouteBuilder<NewParams, Body, Output> {
    return new RouteBuilder({
      ...this.route,
      paramsSchema: params,
    });
  }

  body<NewBody extends undefined | {}>(body: OptionalSchema<NewBody>): RouteBuilder<Params, NewBody, Output> {
    return new RouteBuilder({
      ...this.route,
      bodySchema: body,
    });
  }

  output<NewOutput extends undefined | {}>(output: OptionalSchema<NewOutput>): RouteBuilder<Params, Body, NewOutput> {
    return new RouteBuilder<Params, Body, NewOutput>({
      ...this.route,
      outputSchema: output,
    }); 
  }

  handler(userHandler: (validated: { params: Params, body: Body }) => MaybePromise<Output extends undefined ? any : Output>): Route<Params, Body, Output> {
    return {
      ...this.route,
      handler: userHandler,
    }
  }
}
