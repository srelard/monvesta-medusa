import { isReverseChargeCustomer } from "../pdf/generate-pdf"

describe("isReverseChargeCustomer (§13b UStG)", () => {
  it("is false without a VAT ID (B2C)", () => {
    expect(isReverseChargeCustomer({ country_code: "at" })).toBe(false)
  })

  it("is true for EU non-DE business customers", () => {
    expect(
      isReverseChargeCustomer({ vat_id: "ATU12345678", country_code: "at" })
    ).toBe(true)
    expect(
      isReverseChargeCustomer({ vat_id: "FR12345678901", country_code: "FR" })
    ).toBe(true)
  })

  it("is false for German business customers (domestic B2B)", () => {
    expect(
      isReverseChargeCustomer({ vat_id: "DE123456789", country_code: "de" })
    ).toBe(false)
  })

  it("is false for non-EU customers", () => {
    expect(
      isReverseChargeCustomer({ vat_id: "CHE-123.456.789", country_code: "us" })
    ).toBe(false)
    expect(
      isReverseChargeCustomer({ vat_id: "GB123456789", country_code: "gb" })
    ).toBe(false)
  })

  it("falls back to the VAT ID prefix when no country is stored (legacy invoices)", () => {
    expect(isReverseChargeCustomer({ vat_id: "ATU12345678" })).toBe(true)
    expect(isReverseChargeCustomer({ vat_id: "DE123456789" })).toBe(false)
  })

  it("treats the Greek 'EL' VAT prefix as EU", () => {
    expect(isReverseChargeCustomer({ vat_id: "EL123456789" })).toBe(true)
  })
})
