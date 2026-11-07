/**
 * Common address fields shared across profile types.
 */
export interface Address {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

/**
 * Use when address fields may be nullable in API responses.
 */
export type NullableAddress = {
  [K in keyof Address]: Address[K] | null;
};

export type AddressFormValues = Address;