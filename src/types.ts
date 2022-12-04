import { JSONSchemaType } from 'ajv';

export type OptionalSchema<T> = T extends undefined ? undefined : JSONSchemaType<T>
export type MaybePromise<T> = Promise<T> | T;

export enum HTTPMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
}

export interface Route<
  Params extends undefined | {} = undefined,
  Body extends undefined | {} = undefined,
  Output extends undefined | {} = undefined,
> {
  method: HTTPMethod;
  path: string;
  paramsSchema: OptionalSchema<Params>;
  bodySchema: OptionalSchema<Body>;
  outputSchema: OptionalSchema<Output>;
  handler({ params, body }: { params: Params; body: Body; }): MaybePromise<Output extends undefined ? any : Output>;
}
