import InvoiceModuleService from "../service"

/**
 * The numbering methods only touch `this.listInvoices` / `this.createInvoices`,
 * so they can be tested against a stub without a database.
 */
function makeStub(overrides: Partial<Record<string, jest.Mock>> = {}) {
  // Inherit the real prototype so methods under test can call each other,
  // while the data-access methods are replaced with mocks.
  const stub = Object.create(InvoiceModuleService.prototype)
  return Object.assign(stub, {
    listInvoices: jest.fn().mockResolvedValue([]),
    createInvoices: jest.fn().mockImplementation(async (data: any) => data),
    ...overrides,
  })
}

const currentYear = new Date().getFullYear()

describe("getNextInvoiceNumber", () => {
  it("starts at 0001 for a year without invoices", async () => {
    const stub = makeStub()
    const result = await InvoiceModuleService.prototype.getNextInvoiceNumber.call(
      stub,
      "RE"
    )

    expect(result).toEqual({
      year: currentYear,
      display_id: 1,
      invoice_number: `RE-${currentYear}-0001`,
    })
    expect(stub.listInvoices).toHaveBeenCalledWith(
      { year: currentYear },
      { order: { display_id: "DESC" }, take: 1 }
    )
  })

  it("increments the highest display_id and pads to 4 digits", async () => {
    const stub = makeStub({
      listInvoices: jest.fn().mockResolvedValue([{ display_id: 41 }]),
    })
    const result = await InvoiceModuleService.prototype.getNextInvoiceNumber.call(
      stub,
      "RE"
    )

    expect(result.display_id).toBe(42)
    expect(result.invoice_number).toBe(`RE-${currentYear}-0042`)
  })
})

describe("createInvoiceWithNextNumber", () => {
  it("creates the invoice with the computed number", async () => {
    const stub = makeStub()
    const invoice = await InvoiceModuleService.prototype.createInvoiceWithNextNumber.call(
      stub,
      "RE",
      { order_id: "order_1" }
    )

    expect(invoice).toMatchObject({
      order_id: "order_1",
      year: currentYear,
      display_id: 1,
      invoice_number: `RE-${currentYear}-0001`,
    })
  })

  it("retries with a fresh number on a unique-constraint violation", async () => {
    const uniqueError = Object.assign(new Error("duplicate key"), {
      code: "23505",
    })
    const stub = makeStub({
      listInvoices: jest
        .fn()
        .mockResolvedValueOnce([{ display_id: 7 }])
        .mockResolvedValueOnce([{ display_id: 8 }]),
      createInvoices: jest
        .fn()
        .mockRejectedValueOnce(uniqueError)
        .mockImplementationOnce(async (data) => data),
    })

    const invoice = await InvoiceModuleService.prototype.createInvoiceWithNextNumber.call(
      stub,
      "RE",
      {}
    )

    expect(stub.createInvoices).toHaveBeenCalledTimes(2)
    expect(invoice.display_id).toBe(9)
  })

  it("rethrows non-unique errors immediately", async () => {
    const dbError = Object.assign(new Error("connection lost"), {
      code: "57P01",
    })
    const stub = makeStub({
      createInvoices: jest.fn().mockRejectedValue(dbError),
    })

    await expect(
      InvoiceModuleService.prototype.createInvoiceWithNextNumber.call(stub, "RE", {})
    ).rejects.toThrow("connection lost")
    expect(stub.createInvoices).toHaveBeenCalledTimes(1)
  })

  it("gives up after exhausting retries on persistent conflicts", async () => {
    const uniqueError = Object.assign(new Error("duplicate key"), {
      code: "23505",
    })
    const stub = makeStub({
      createInvoices: jest.fn().mockRejectedValue(uniqueError),
    })

    await expect(
      InvoiceModuleService.prototype.createInvoiceWithNextNumber.call(stub, "RE", {})
    ).rejects.toThrow("duplicate key")
    expect(stub.createInvoices).toHaveBeenCalledTimes(5)
  })
})
