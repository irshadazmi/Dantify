
/**
 * Shared address fields used by all Dantify profiles.
 */

export interface Address {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export type AddressFormValues = Address;

export type AddressPayload = Partial<Address>;
