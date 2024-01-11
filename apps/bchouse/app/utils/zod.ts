import { z, ZodError } from "zod";

export const toDefault = <T, Z>(defaultValue:Z) => (value:T) => {
  return typeof value === 'undefined' || value === null ? defaultValue : value;
}

export const optionalType = <T extends z.ZodType<any>, Z>(typeSchema: T) => {
  const parse = (value: any) => {
    //If not nullish to begin with, then would throw an error.
    if (typeof value === 'undefined') {
      return undefined;
    }

    try {
      typeSchema.parse(value);
      return value;
    } catch (error) {
      if (error instanceof ZodError) {
        return undefined;
      } else {
        throw error;
      }
    }
  };

  return typeSchema
    .optional()
    .transform((value) => {
      return parse(value) ? value : undefined;
    });
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type Flatten<T> = UnionToIntersection<{ [U in keyof T]: T[U]; }>;
type OnlyAllowedKeys<T, U> = { [K in keyof U]: K extends keyof T ? U[K] : never };
type Spread<A, B> = {
  [K in keyof A | keyof B]: K extends keyof A
    ? K extends keyof B
      ? A[K] | B[K]
      : A[K]
    : K extends keyof B
    ? B[K]
    : never;
};

export function withDefaults<
  T extends z.ZodType,
  U extends OnlyAllowedKeys<T["_type"], U>,
  V extends Flatten<Spread<U, T["_type"]>>,
>(
  typeSchema: T, 
  defaultValue: U,
) {
  return typeSchema.transform<V>((o) => ({ ...defaultValue, ...o })) as z.ZodEffects<T, V>;
}