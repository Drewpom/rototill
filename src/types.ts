import { ErrorObject, JSONSchemaType } from 'ajv';
import { Request } from 'express';

export type OptionalSchema<T> = T extends undefined ? undefined : JSONSchemaType<T>
export type MaybePromise<T> = Promise<T> | T;

export enum HTTPMethod {
  Get = 'get',
  Post = 'post',
  Put = 'put',
  Delete = 'delete',
}

export type Route<InjectedValues, Output> = {
  method: HTTPMethod;
  path: string;
  middlewares: AnyRouteMiddleware<InjectedValues>[];
  handler: (values: InjectedValues, request: Request) => MaybePromise<Output extends undefined ? any : Output>;
}

export type RouteMiddleware<CurrentInjectedValues, NewInjectedValues> = (request: Request, currentInjectedValues: CurrentInjectedValues) => NewInjectedValues;
export type AsyncRouteMiddleware<CurrentInjectedValues, NewInjectedValues> = (request: Request, currentInjectedValues: CurrentInjectedValues) => Promise<NewInjectedValues>;
export type AnyRouteMiddleware<CurrentInjectedValues> =  (request: Request, currentInjectedValues: CurrentInjectedValues) => any;

type GenericErrorObject = ErrorObject<string, Record<string, any>, unknown>;

export class RototillValidationError extends Error {
  errorObjects: GenericErrorObject[];

  constructor(errorObjects: GenericErrorObject[]) {
    super('Failed validation');

    this.errorObjects = errorObjects;
  }
}
