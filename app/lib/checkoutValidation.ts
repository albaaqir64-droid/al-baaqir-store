export type CheckoutFormValues = {
  fullName: string;
  mobile: string;
  email: string;
  customerGSTIN: string;
  house: string;
  street: string;
  pincode: string;
  city: string;
  state: string;
};

export function getCheckoutValidationErrors(form: CheckoutFormValues, itemCount: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!/^[6-9][0-9]{9}$/.test(form.mobile.trim())) errors.mobile = "Enter a valid 10-digit mobile number.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.customerGSTIN && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(form.customerGSTIN.trim())) {
    errors.customerGSTIN = "Enter a valid 15-character GSTIN.";
  }
  if (!form.house.trim()) errors.house = "House / flat number is required.";
  if (!form.street.trim()) errors.street = "Street / area is required.";
  if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State is required.";
  if (itemCount < 1) errors.cart = "Your cart is empty. Add items before placing an order.";
  return errors;
}
