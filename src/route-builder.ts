import {JSONSchemaType} from "ajv"
import { AJVInstance } from './schema-helpers.cjs';
import { Request } from 'express';
import { AsyncRouteMiddleware, AnyRouteMiddleware, RouteMiddleware, HTTPMethod, OptionalSchema, MaybePromise, Route, RototillValidationError } from './types.js';
 
const createParamValidator = <Params>(ajv: AJVInstance, schema: JSONSchemaType<Params>): ((request: Request) => { params: Params }) => {
  const validateParams = ajv.compile(schema);

  return (request) => {
    const params = request.params;
    if (!validateParams(params)) {
      throw new RototillValidationError(validateParams.errors ?? []);
    }

    return { params };
  };
}

const createBodyValidator = <Body>(ajv: AJVInstance, schema: JSONSchemaType<Body>): ((request: Request) => { body: Body }) => {
  const validate = ajv.compile(schema);

  return (request) => {
    const body = request.body;
    if (!validate(body)) {
      throw new RototillValidationError(validate.errors ?? []);
    }

    return { body };
  };
}

type RouteBuilderState<InjectedValues = object, Output = unknown | undefined> = {
  paramAjv: AJVInstance,
  bodyAjv: AJVInstance,
  method: HTTPMethod, 
  path: string,
  stages: AnyRouteMiddleware<InjectedValues>[],
  outputSchema: OptionalSchema<Output> | undefined,
  paramSchema: JSONSchemaType<unknown> | undefined,
  bodySchema: JSONSchemaType<unknown> | undefined,
}

export class RouteBuilder<InjectedValues = object, Output = unknown | undefined> {
  private state: RouteBuilderState<InjectedValues, Output>

  private constructor(state: RouteBuilderState<InjectedValues, Output>) {
    this.state = state;
  }
  
  static new<InjectedContext>(paramAjv: AJVInstance, bodyAjv: AJVInstance, method: HTTPMethod, path: string): RouteBuilder<InjectedContext, undefined> {
    return new RouteBuilder<InjectedContext, undefined>({
      paramAjv,
      bodyAjv,
      method, 
      path,
      stages: [],
      outputSchema: undefined,
      paramSchema: undefined,
      bodySchema: undefined,
    });
  }

  addMiddleware<NewInjectedValues>(
    newStage: RouteMiddleware<InjectedValues, NewInjectedValues>
  ): RouteBuilder<InjectedValues & NewInjectedValues, Output> {
    const newStages: AnyRouteMiddleware<InjectedValues>[] = this.state.stages.slice();
    newStages.push(newStage);
    return new RouteBuilder<InjectedValues & NewInjectedValues, Output>({
      ...this.state,
      stages: newStages,
    });
  }

  addAsyncMiddleware<NewInjectedValues>(
    newStage: AsyncRouteMiddleware<InjectedValues, NewInjectedValues>
  ): RouteBuilder<InjectedValues & NewInjectedValues, Output> {
    const newStages: AnyRouteMiddleware<InjectedValues>[] = this.state.stages.slice();
    newStages.push(newStage);
    return new RouteBuilder<InjectedValues & NewInjectedValues, Output>({
      ...this.state,
      stages: newStages,
    });
  }

  params<Params>(params: JSONSchemaType<Params>): RouteBuilder<InjectedValues & { params: Params }, Output> {
    const validator = createParamValidator(this.state.paramAjv, params);
    this.state.paramSchema = params as JSONSchemaType<unknown>;
    return this.addMiddleware(validator);
  }

  body<Body>(body: JSONSchemaType<Body>): RouteBuilder<InjectedValues & { body: Body }, Output> {
    const validator = createBodyValidator(this.state.bodyAjv, body);
    this.state.bodySchema = body as JSONSchemaType<unknown>;
    return this.addMiddleware(validator);
  }

  output<NewOutput>(output: OptionalSchema<NewOutput>): RouteBuilder<InjectedValues, NewOutput> {
    return new RouteBuilder<InjectedValues, NewOutput>({
      ...this.state,
      outputSchema: output,
    });
  }

  handler(userHandler: (values: InjectedValues, request: Request) => MaybePromise<Output extends undefined ? any : Output>): Route<InjectedValues, Output> {
    return {
      method: this.state.method,
      path: this.state.path,
      paramSchema: this.state.paramSchema,
      bodySchema: this.state.bodySchema,
      outputSchema: this.state.outputSchema as JSONSchemaType<unknown> | undefined,
      middlewares: this.state.stages,
      handler: userHandler,
    };
  }
}
