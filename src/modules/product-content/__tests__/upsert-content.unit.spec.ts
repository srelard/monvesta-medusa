import ProductContentModuleService, {
  sortContentRelations,
} from "../service"

// Passing a context that already carries a transactionManager makes
// @InjectTransactionManager call the original method directly, so the
// upsert logic can be tested against a stub without a database.
const txContext = { transactionManager: {} } as any

function makeStub(existing: any[] = []) {
  const retrieved = {
    id: existing[0]?.id ?? "pc_new",
    trust_badges: [],
    stats: [],
    features: [],
    course_modules: [],
    audience: [],
    testimonials: [],
    faqs: [],
  }

  // Inherit the real prototype so private helpers (createChildren, ...)
  // resolve, while the data-access methods are replaced with mocks.
  const stub = Object.create(ProductContentModuleService.prototype)
  return Object.assign(stub, {
    listProductContents: jest.fn().mockResolvedValue(existing),
    retrieveProductContent: jest.fn().mockResolvedValue(retrieved),
    createProductContents: jest.fn().mockResolvedValue({ id: "pc_new" }),
    updateProductContents: jest.fn().mockResolvedValue({}),
    deleteProductTrustBadges: jest.fn(),
    deleteProductStats: jest.fn(),
    deleteProductFeatures: jest.fn(),
    deleteProductCourseModules: jest.fn(),
    deleteProductAudiencePoints: jest.fn(),
    deleteProductTestimonials: jest.fn(),
    deleteProductFaqs: jest.fn(),
    createProductTrustBadges: jest.fn(),
    createProductStats: jest.fn(),
    createProductFeatures: jest.fn(),
    createProductCourseModules: jest.fn(),
    createProductAudiencePoints: jest.fn(),
    createProductTestimonials: jest.fn(),
    createProductFaqs: jest.fn(),
  })
}

const upsert = (stub: any, input: any) =>
  (ProductContentModuleService.prototype.upsertContent as any).call(
    stub,
    input,
    txContext
  )

describe("upsertContent", () => {
  it("creates a new root record when none exists", async () => {
    const stub = makeStub([])

    const result = await upsert(stub, {
      product_id: "prod_1",
      badge: "Online-Kurs",
      faqs: [{ question: "Q1", answer: "A1" }],
    })

    expect(result.created).toBe(true)
    expect(stub.createProductContents).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: "prod_1", badge: "Online-Kurs" }),
      expect.anything()
    )
    expect(stub.updateProductContents).not.toHaveBeenCalled()
    expect(stub.createProductFaqs).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          question: "Q1",
          answer: "A1",
          sort_order: 0,
          content_id: "pc_new",
        }),
      ],
      expect.anything()
    )
  })

  it("replaces children and updates the root when content exists", async () => {
    const stub = makeStub([{ id: "pc_1" }])
    stub.retrieveProductContent.mockResolvedValue({
      id: "pc_1",
      trust_badges: [{ id: "tb_1" }],
      stats: [],
      features: [],
      course_modules: [],
      audience: [],
      testimonials: [],
      faqs: [],
    })

    const result = await upsert(stub, {
      product_id: "prod_1",
      trust_badges: [{ label: "14 Tage Geld-zurück" }],
    })

    expect(result.created).toBe(false)
    expect(stub.deleteProductTrustBadges).toHaveBeenCalledWith(
      ["tb_1"],
      expect.anything()
    )
    expect(stub.updateProductContents).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pc_1" }),
      expect.anything()
    )
    expect(stub.createProductContents).not.toHaveBeenCalled()
    expect(stub.createProductTrustBadges).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          label: "14 Tage Geld-zurück",
          sort_order: 0,
          content_id: "pc_1",
        }),
      ],
      expect.anything()
    )
  })

  it("assigns array indexes as sort_order", async () => {
    const stub = makeStub([])

    await upsert(stub, {
      product_id: "prod_1",
      stats: [
        { value: "200+", label: "Teilnehmer" },
        { value: "4.9", label: "Bewertung" },
      ],
    })

    expect(stub.createProductStats).toHaveBeenCalledWith(
      [
        expect.objectContaining({ sort_order: 0, value: "200+" }),
        expect.objectContaining({ sort_order: 1, value: "4.9" }),
      ],
      expect.anything()
    )
  })
})

describe("sortContentRelations", () => {
  it("sorts every child relation by sort_order", () => {
    const content = {
      faqs: [
        { question: "B", sort_order: 1 },
        { question: "A", sort_order: 0 },
      ],
      stats: [
        { value: "2", sort_order: 2 },
        { value: "0" }, // missing sort_order sorts as 0
        { value: "1", sort_order: 1 },
      ],
    }

    const sorted = sortContentRelations(content as any)

    expect(sorted.faqs.map((f: any) => f.question)).toEqual(["A", "B"])
    expect(sorted.stats.map((s: any) => s.value)).toEqual(["0", "1", "2"])
  })
})
