/** A 24 character hex id, the ObjectId format every record and the client use. */
export const isIdString = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{24}$/i.test(value);
