import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  toast,
  Prompt,
} from "@medusajs/ui"
import { DocumentText, Trash } from "@medusajs/icons"
import { useState, useEffect, useCallback } from "react"

interface InvoiceData {
  id: string
  invoice_number: string
  issued_at: string
  status: string
  total: number
  currency_code: string
  file_url: string | null
}

const OrderInvoiceWidget = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`/admin/orders/${order.id}/invoice`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setIsLoading(false)
    }
  }, [order.id])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/admin/orders/${order.id}/invoice`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Rechnung ${data.invoice_number} erstellt`)
        await fetchInvoices()
      } else {
        const err = await res.json()
        toast.error(err.message || "Fehler beim Erstellen der Rechnung")
      }
    } catch {
      toast.error("Fehler beim Erstellen der Rechnung")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (invoice: InvoiceData) => {
    if (invoice.file_url) {
      window.open(invoice.file_url, "_blank")
    }
  }

  const handleDelete = async (invoice: InvoiceData) => {
    if (!confirm(`Rechnung ${invoice.invoice_number} wirklich löschen?`)) return
    try {
      const res = await fetch(`/admin/orders/${order.id}/invoice/${invoice.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        toast.success(`Rechnung ${invoice.invoice_number} gelöscht`)
        await fetchInvoices()
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch {
      toast.error("Fehler beim Löschen")
    }
  }

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date))

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount)

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center gap-2 px-6 py-4">
          <DocumentText />
          <Heading level="h2">Rechnungen</Heading>
        </div>
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">Laden...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <DocumentText />
          <Heading level="h2">Rechnungen</Heading>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={handleGenerate}
          isLoading={isGenerating}
          disabled={isGenerating}
        >
          Rechnung erstellen
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">
            Noch keine Rechnung vorhanden.
          </Text>
        </div>
      ) : (
        invoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between px-6 py-3"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Text className="font-medium">{inv.invoice_number}</Text>
                <Badge
                  color={inv.status === "generated" ? "green" : inv.status === "failed" ? "red" : "grey"}
                >
                  {inv.status === "generated"
                    ? "Erstellt"
                    : inv.status === "failed"
                      ? "Fehlgeschlagen"
                      : "Ausstehend"}
                </Badge>
              </div>
              <Text size="small" className="text-ui-fg-subtle">
                {formatDate(inv.issued_at)} &middot;{" "}
                {formatCurrency(inv.total, inv.currency_code)}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              {inv.file_url && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleDownload(inv)}
                >
                  PDF herunterladen
                </Button>
              )}
              <button
                onClick={() => handleDelete(inv)}
                className="text-ui-fg-subtle hover:text-ui-fg-error p-1 transition-colors"
                title="Rechnung löschen"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderInvoiceWidget
