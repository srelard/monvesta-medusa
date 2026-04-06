import PdfMakeModule from "pdfmake"
// Handle ESM/CJS interop
const PdfPrinter = (PdfMakeModule as any).default || PdfMakeModule
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
// pdfmake document definition type
type TDocumentDefinitions = any

// Resolve Roboto fonts bundled with pdfmake
function getFontsDir(): string {
  try {
    const pdfmakePkg = require.resolve("pdfmake/package.json")
    return resolve(dirname(pdfmakePkg), "fonts", "Roboto")
  } catch {
    // Fallback for different module resolution
    return resolve(process.cwd(), "node_modules", "pdfmake", "fonts", "Roboto")
  }
}

const fontsDir = getFontsDir()

const fonts = {
  Roboto: {
    normal: resolve(fontsDir, "Roboto-Regular.ttf"),
    bold: resolve(fontsDir, "Roboto-Medium.ttf"),
    italics: resolve(fontsDir, "Roboto-Italic.ttf"),
    bolditalics: resolve(fontsDir, "Roboto-MediumItalic.ttf"),
  },
}

export type InvoicePdfData = {
  // Invoice
  invoice_number: string
  issued_at: Date | string
  // Company (from config)
  company: {
    name: string
    address: string
    city: string
    postal_code: string
    country: string
    email: string
    phone?: string
    vat_id: string
    registration?: string
    managing_director: string
    bank_name: string
    bank_iban: string
    bank_bic: string
    logo_url?: string
    footer_text?: string
  }
  // Customer
  customer: {
    name: string
    email: string
    address: string
    vat_id?: string
  }
  // Items
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    total: number
    tax_amount: number
  }>
  // Totals
  subtotal: number
  tax_total: number
  total: number
  tax_rate: number
  currency_code: string
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function buildInvoiceDocDefinition(data: InvoicePdfData): TDocumentDefinitions {
  const { company, customer, items, invoice_number, issued_at } = data
  const cur = data.currency_code

  const companyOneLiner = `${company.name} · ${company.address} · ${company.postal_code} ${company.city}`

  // Check if reverse charge applies (EU customer with VAT ID)
  const isReverseCharge = !!customer.vat_id

  // Item rows for table
  const itemRows = items.map((item, i) => [
    { text: String(i + 1), alignment: "center" as const },
    { text: item.title },
    { text: String(item.quantity), alignment: "center" as const },
    { text: formatCurrency(item.unit_price, cur), alignment: "right" as const },
    { text: formatCurrency(item.total, cur), alignment: "right" as const },
  ])

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [50, 60, 50, 100],

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          width: "*",
          text: [
            { text: `${company.name}\n`, bold: true, fontSize: 7 },
            { text: `${company.address}, ${company.postal_code} ${company.city}\n`, fontSize: 7 },
            { text: `${company.email}`, fontSize: 7 },
            company.phone ? { text: ` · ${company.phone}`, fontSize: 7 } : { text: "" },
          ],
        },
        {
          width: "*",
          text: [
            { text: "Bankverbindung\n", bold: true, fontSize: 7 },
            { text: `${company.bank_name}\n`, fontSize: 7 },
            { text: `IBAN: ${company.bank_iban}\n`, fontSize: 7 },
            { text: `BIC: ${company.bank_bic}`, fontSize: 7 },
          ],
        },
        {
          width: "*",
          text: [
            { text: `USt-IdNr.: ${company.vat_id}\n`, fontSize: 7 },
            company.registration
              ? { text: `${company.registration}\n`, fontSize: 7 }
              : { text: "" },
            { text: `Geschäftsführer: ${company.managing_director}\n`, fontSize: 7 },
            { text: `Seite ${currentPage}/${pageCount}`, fontSize: 7 },
          ],
        },
      ],
      margin: [50, 10, 50, 0],
    }),

    content: [
      // Company sender line (small, above recipient)
      {
        text: companyOneLiner,
        fontSize: 7,
        color: "#666666",
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },

      // Recipient address block
      {
        text: [
          customer.name + "\n",
          customer.address,
          customer.vat_id ? `\nUSt-IdNr.: ${customer.vat_id}` : "",
        ],
        fontSize: 10,
        margin: [0, 0, 0, 30] as [number, number, number, number],
      },

      // Invoice title + meta
      {
        columns: [
          {
            width: "*",
            text: `Rechnung ${invoice_number}`,
            fontSize: 18,
            bold: true,
          },
          {
            width: "auto",
            alignment: "right" as const,
            text: [
              { text: "Rechnungsnummer: ", fontSize: 9, color: "#666666" },
              { text: `${invoice_number}\n`, fontSize: 9 },
              { text: "Rechnungsdatum: ", fontSize: 9, color: "#666666" },
              { text: `${formatDate(issued_at)}\n`, fontSize: 9 },
              { text: "Leistungsdatum: ", fontSize: 9, color: "#666666" },
              { text: formatDate(issued_at), fontSize: 9 },
            ],
          },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: [30, "*", 40, 80, 80],
          body: [
            // Header
            [
              { text: "Pos.", bold: true, fontSize: 9 },
              { text: "Bezeichnung", bold: true, fontSize: 9 },
              { text: "Menge", bold: true, fontSize: 9, alignment: "center" as const },
              { text: "Einzelpreis", bold: true, fontSize: 9, alignment: "right" as const },
              { text: "Gesamt", bold: true, fontSize: 9, alignment: "right" as const },
            ],
            // Items
            ...itemRows,
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === 1 || i === node.table.body.length ? 1 : 0,
          vLineWidth: () => 0,
          hLineColor: () => "#cccccc",
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Totals
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 200,
            table: {
              widths: ["*", 80],
              body: [
                [
                  { text: "Nettobetrag", fontSize: 9 },
                  { text: formatCurrency(data.subtotal, cur), alignment: "right" as const, fontSize: 9 },
                ],
                ...(isReverseCharge
                  ? [
                      [
                        { text: "USt. (Reverse Charge)", fontSize: 9, color: "#666666" },
                        { text: formatCurrency(0, cur), alignment: "right" as const, fontSize: 9, color: "#666666" },
                      ],
                    ]
                  : [
                      [
                        { text: `USt. ${data.tax_rate}%`, fontSize: 9 },
                        { text: formatCurrency(data.tax_total, cur), alignment: "right" as const, fontSize: 9 },
                      ],
                    ]),
                [
                  { text: "Gesamtbetrag", fontSize: 11, bold: true },
                  {
                    text: formatCurrency(data.total, cur),
                    alignment: "right" as const,
                    fontSize: 11,
                    bold: true,
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number, node: any) =>
                i === node.table.body.length - 1 || i === node.table.body.length ? 1 : 0,
              vLineWidth: () => 0,
              hLineColor: () => "#333333",
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Reverse charge notice
      ...(isReverseCharge
        ? [
            {
              text: "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge gemäß §13b UStG). Die Umsatzsteuer ist vom Leistungsempfänger zu entrichten.",
              fontSize: 8,
              italics: true,
              color: "#666666",
              margin: [0, 0, 0, 15] as [number, number, number, number],
            },
          ]
        : []),

      // Footer text
      ...(company.footer_text
        ? [
            {
              text: company.footer_text,
              fontSize: 9,
              color: "#444444",
              margin: [0, 10, 0, 0] as [number, number, number, number],
            },
          ]
        : []),
    ],

    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
    },
  }

  return docDefinition
}

/**
 * Generate a PDF buffer from invoice data.
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const printer = new PdfPrinter(fonts)
  const docDefinition = buildInvoiceDocDefinition(data)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk))
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)))
    pdfDoc.on("error", reject)
    pdfDoc.end()
  })
}
