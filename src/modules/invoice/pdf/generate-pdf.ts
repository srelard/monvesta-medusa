/* eslint-disable @typescript-eslint/no-require-imports */
const PdfPrinter = require("pdfmake")
const vfsFonts = require("pdfmake/build/vfs_fonts")

// pdfmake document definition type
type TDocumentDefinitions = any

// Use bundled vfs fonts (base64 encoded, no file paths needed)
const fonts = {
  Roboto: {
    normal: Buffer.from(vfsFonts["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(vfsFonts["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(vfsFonts["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(vfsFonts["Roboto-MediumItalic.ttf"], "base64"),
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
    customer_id?: string
  }
  // Items
  items: Array<{
    title: string
    sku?: string
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
  _logoBase64?: string
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
    { text: String(i + 1), alignment: "center" as const, fontSize: 9 },
    { text: item.sku || "", fontSize: 8, color: "#666666" },
    { text: item.title, fontSize: 9 },
    { text: String(item.quantity), alignment: "center" as const, fontSize: 9 },
    { text: formatCurrency(item.unit_price, cur), alignment: "right" as const, fontSize: 9 },
    { text: formatCurrency(item.total, cur), alignment: "right" as const, fontSize: 9 },
  ])

  // DIN 5008 fold marks (Y positions in mm from top)
  const FOLD_MARK_TOP = 87 // mm — upper fold (DIN 5008)
  const FOLD_MARK_BOTTOM = 192 // mm — lower fold (DIN 5008)
  const PUNCH_MARK = 148.5 // mm — hole punch mark

  const mmToPt = (mm: number) => mm * 2.835

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [50, 60, 50, 100],

    // Fold marks + punch mark (DIN 5008)
    background: [
      // Upper fold mark
      { canvas: [{ type: "line", x1: 5, y1: mmToPt(FOLD_MARK_TOP), x2: 20, y2: mmToPt(FOLD_MARK_TOP), lineWidth: 0.5, lineColor: "#999999" }] },
      // Punch mark (center)
      { canvas: [{ type: "line", x1: 5, y1: mmToPt(PUNCH_MARK), x2: 15, y2: mmToPt(PUNCH_MARK), lineWidth: 0.5, lineColor: "#999999" }] },
      // Lower fold mark
      { canvas: [{ type: "line", x1: 5, y1: mmToPt(FOLD_MARK_BOTTOM), x2: 20, y2: mmToPt(FOLD_MARK_BOTTOM), lineWidth: 0.5, lineColor: "#999999" }] },
    ],

    footer: (currentPage: number, pageCount: number) => ([
      // Separator line above footer
      { canvas: [{ type: "line", x1: 50, y1: 0, x2: 545, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }], margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
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
        margin: [50, 0, 50, 0],
      },
    ]),

    content: [
      // Logo (inserted dynamically if available)
      ...(data._logoBase64 ? [{ image: data._logoBase64, width: 140, margin: [0, 0, 0, 20] as [number, number, number, number] }] : []),

      // Company sender line (small, above recipient)
      {
        text: companyOneLiner,
        fontSize: 7,
        color: "#999999",
        decoration: "underline" as const,
        decorationColor: "#cccccc",
        margin: [0, 15, 0, 3] as [number, number, number, number],
      },

      // Recipient address block (Fenster-Format)
      {
        text: [
          customer.name + "\n",
          customer.address,
          customer.vat_id ? `\nUSt-IdNr.: ${customer.vat_id}` : "",
        ],
        fontSize: 10,
        lineHeight: 1.4,
        margin: [0, 0, 0, 40] as [number, number, number, number],
      },

      // Invoice meta (right-aligned box)
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 220,
            table: {
              widths: [90, "*"],
              body: [
                [
                  { text: "Rechnungsnr.:", fontSize: 9, color: "#666666", alignment: "right" as const, border: [false, false, false, false] },
                  { text: invoice_number, fontSize: 9, bold: true, alignment: "right" as const, border: [false, false, false, false] },
                ],
                [
                  { text: "Rechnungsdatum:", fontSize: 9, color: "#666666", alignment: "right" as const, border: [false, false, false, false] },
                  { text: formatDate(issued_at), fontSize: 9, alignment: "right" as const, border: [false, false, false, false] },
                ],
                [
                  { text: "Leistungsdatum:", fontSize: 9, color: "#666666", alignment: "right" as const, border: [false, false, false, false] },
                  { text: formatDate(issued_at), fontSize: 9, alignment: "right" as const, border: [false, false, false, false] },
                ],
                ...(customer.customer_id ? [[
                  { text: "Kundennr.:", fontSize: 9, color: "#666666", alignment: "right" as const, border: [false, false, false, false] },
                  { text: customer.customer_id, fontSize: 9, alignment: "right" as const, border: [false, false, false, false] },
                ]] : []),
              ],
            },
            layout: "noBorders",
          },
        ],
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },

      // Invoice title
      {
        text: `Rechnung ${invoice_number}`,
        fontSize: 14,
        bold: true,
        color: "#333333",
        margin: [0, 0, 0, 16] as [number, number, number, number],
      },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: [25, 50, "*", 35, 70, 70],
          body: [
            // Header with background
            [
              { text: "Pos.", bold: true, fontSize: 8, color: "#ffffff", fillColor: "#333333" },
              { text: "Art.-Nr.", bold: true, fontSize: 8, color: "#ffffff", fillColor: "#333333" },
              { text: "Bezeichnung", bold: true, fontSize: 8, color: "#ffffff", fillColor: "#333333" },
              { text: "Menge", bold: true, fontSize: 8, alignment: "center" as const, color: "#ffffff", fillColor: "#333333" },
              { text: "Einzelpreis", bold: true, fontSize: 8, alignment: "right" as const, color: "#ffffff", fillColor: "#333333" },
              { text: "Gesamt", bold: true, fontSize: 8, alignment: "right" as const, color: "#ffffff", fillColor: "#333333" },
            ],
            // Items
            ...itemRows,
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0,
          vLineWidth: () => 0,
          hLineColor: () => "#dddddd",
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 4,
          paddingRight: () => 4,
        },
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // Totals
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 220,
            table: {
              widths: ["*", 80],
              body: [
                [
                  { text: "Nettobetrag", fontSize: 9, border: [false, false, false, false] },
                  { text: formatCurrency(data.subtotal, cur), alignment: "right" as const, fontSize: 9, border: [false, false, false, false] },
                ],
                ...(isReverseCharge
                  ? [
                      [
                        { text: "USt. (Reverse Charge)", fontSize: 9, color: "#666666", border: [false, false, false, false] },
                        { text: formatCurrency(0, cur), alignment: "right" as const, fontSize: 9, color: "#666666", border: [false, false, false, false] },
                      ],
                    ]
                  : [
                      [
                        { text: `USt. ${data.tax_rate}%`, fontSize: 9, border: [false, false, false, true] },
                        { text: formatCurrency(data.tax_total, cur), alignment: "right" as const, fontSize: 9, border: [false, false, false, true] },
                      ],
                    ]),
                [
                  { text: "Gesamtbetrag", fontSize: 11, bold: true, fillColor: "#f2f2f2", color: "#222222", border: [false, false, false, false] },
                  {
                    text: formatCurrency(data.total, cur),
                    alignment: "right" as const,
                    fontSize: 11,
                    bold: true,
                    fillColor: "#f2f2f2",
                    color: "#222222",
                    border: [false, false, false, false],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number) => i === 0 ? 0 : 0.5,
              vLineWidth: () => 0,
              hLineColor: () => "#cccccc",
              paddingTop: () => 5,
              paddingBottom: () => 5,
              paddingLeft: () => 4,
              paddingRight: () => 4,
            },
          },
        ],
        margin: [0, 0, 0, 25] as [number, number, number, number],
      },

      // Payment terms
      {
        text: "Bereits bezahlt per Online-Zahlung. Vielen Dank!",
        fontSize: 9,
        bold: true,
        color: "#333333",
        margin: [0, 0, 0, 10] as [number, number, number, number],
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
              color: "#888888",
              italics: true,
              margin: [0, 5, 0, 0] as [number, number, number, number],
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
  console.log(`[Invoice PDF] Generating PDF for ${data.invoice_number}...`)

  // Fetch logo if URL provided
  if (data.company.logo_url && !data._logoBase64) {
    try {
      const res = await fetch(data.company.logo_url)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const mime = res.headers.get("content-type") || "image/png"
        data._logoBase64 = `data:${mime};base64,${buf.toString("base64")}`
        console.log(`[Invoice PDF] Logo loaded (${buf.length} bytes)`)
      }
    } catch (err) {
      console.warn(`[Invoice PDF] Could not load logo:`, err)
    }
  }

  const printer = new PdfPrinter(fonts)
  const docDefinition = buildInvoiceDocDefinition(data)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk))
    pdfDoc.on("end", () => { console.log(`[Invoice PDF] Done, ${Buffer.concat(chunks).length} bytes`); resolve(Buffer.concat(chunks)) })
    pdfDoc.on("error", (err: any) => { console.error(`[Invoice PDF] Error:`, err); reject(err) })
    pdfDoc.end()
  })
}
