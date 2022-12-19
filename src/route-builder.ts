import Ajv, {JSONSchemaType} from "ajv"
import { Request } from 'express';
import { AnyRouteMiddleware, RouteMiddleware, HTTPMethod, OptionalSchema, MaybePromise, Route, RototillValidationError } from './types.js';
 
const createParamValidator = <Params>(ajv: Ajv.default, schema: JSONSchemaType<Params>): ((request: Request) => { params: Params }) => {
  const validateParams = ajv.compile(schema);

  return (request) => {
    const params = request.params;
    if (!validateParams(params)) {
      throw new RototillValidationError(validateParams.errors!);
    }

    return { params };
  };
}

const createBodyValidator = <Body>(ajv: Ajv.default, schema: JSONSchemaType<Body>): ((request: Request) => { body: Body }) => {
  const validate = ajv.compile(schema);

  return (request) => {
    const body = request.body;
    if (!validate(body)) {
      throw new RototillValidationError(validate.errors!);
    }

    return { body };
  };
}

export class RouteBuilder<InjectedValues = {}, Output = {} | undefined> {
  private ajv: Ajv.default;
  private method: HTTPMethod;
  private path: string;
  private stages: AnyRouteMiddleware<InjectedValues>[]
  private outputSchema: OptionalSchema<Output>;

  private constructor(ajv: Ajv.default, method: HTTPMethod,  path: string, stages: AnyRouteMiddleware<InjectedValues>[], outputSchema: OptionalSchema<Output>) {
    this.ajv = ajv;
    this.method = method;
    this.path = path;
    this.stages = stages;
    this.outputSchema = outputSchema;
  }
  
  static new(ajv: Ajv.default, method: HTTPMethod,  path: string): RouteBuilder<{}, undefined> {
    return new RouteBuilder<{}, undefined>(ajv, method,  path, [], undefined);
  }

  addMiddleware<NewInjectedValues>(
    newStage: RouteMiddleware<InjectedValues, NewInjectedValues>
  ): RouteBuilder<InjectedValues & NewInjectedValues, Output> {
    const newStages: Array<((request: Request, currentInjectedValues: InjectedValues) => any)> = this.stages.slice();
    newStages.push(newStage);
    return new RouteBuilder<InjectedValues & NewInjectedValues, Output>(
      this.ajv,
      this.method,
      this.path,
      newStages,
      this.outputSchema,
    );
  }

  params<Params>(params: JSONSchemaType<Params>): RouteBuilder<InjectedValues & { params: Params }, Output> {
    const validator = createParamValidator(this.ajv, params);
    return this.addMiddleware(validator);
  }

  body<Body>(body: JSONSchemaType<Body>): RouteBuilder<InjectedValues & { body: Body }, Output> {
    const validator = createBodyValidator(this.ajv, body);
    return this.addMiddleware(validator);
  }

  output<NewOutput extends {}>(output: OptionalSchema<NewOutput>): RouteBuilder<InjectedValues, NewOutput> {
    return new RouteBuilder<InjectedValues, NewOutput>(
      this.ajv,
      this.method,
      this.path,
      this.stages,
      output,
    );
  }

  handler(userHandler: (values: InjectedValues, request: Request) => MaybePromise<Output extends undefined ? any : Output>): Route<InjectedValues, Output> {
    return {
      method: this.method,
      path: this.path,
      middlewares: this.stages,
      handler: userHandler,
    };
  }
}
