import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Textarea,
  toast,
} from "@medusajs/ui"
import { DocumentText } from "@medusajs/icons"
import { useState, useEffect } from "react"

interface InvoiceConfigData {
  id?: string
  company_name: string
  company_address: string
  company_city: string
  company_postal_code: string
  company_country: string
  company_email: string
  company_phone: string
  company_vat_id: string
  company_registration: string
  managing_director: string
  bank_name: string
  bank_iban: string
  bank_bic: string
  logo_url: string
  invoice_prefix: string
  default_tax_rate: number
  footer_text: string
}

const defaultConfig: InvoiceConfigData = {
  company_name: "",
  company_address: "",
  company_city: "",
  company_postal_code: "",
  company_country: "Deutschland",
  company_email: "",
  company_phone: "",
  company_vat_id: "",
  company_registration: "",
  managing_director: "",
  bank_name: "",
  bank_iban: "",
  bank_bic: "",
  logo_url: "",
  invoice_prefix: "RE",
  default_tax_rate: 19,
  footer_text: "",
}

const InvoiceConfigPage = () => {
  const [config, setConfig] = useState<InvoiceConfigData>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/admin/invoice-config", {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          if (data.invoice_config) {
            setConfig({ ...defaultConfig, ...data.invoice_config })
          }
        }
      } catch {
        // Use defaults
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/admin/invoice-config", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        const data = await res.json()
        setConfig({ ...defaultConfig, ...data.invoice_config })
        toast.success("Rechnungskonfiguration gespeichert")
      } else {
        toast.error("Fehler beim Speichern")
      }
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof InvoiceConfigData, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">Rechnungskonfiguration</Heading>
          <Text className="text-ui-fg-subtle mt-1">Laden...</Text>
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Company Details */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h1">Rechnungskonfiguration</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Firmendaten und Einstellungen für die automatische Rechnungserstellung.
          </Text>
        </div>

        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">
            Firmendaten
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Firmenname *</Label>
              <Input
                id="company_name"
                value={config.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="Monvesta GmbH"
              />
            </div>
            <div>
              <Label htmlFor="managing_director">Geschäftsführer *</Label>
              <Input
                id="managing_director"
                value={config.managing_director}
                onChange={(e) => updateField("managing_director", e.target.value)}
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <Label htmlFor="company_address">Straße + Nr. *</Label>
              <Input
                id="company_address"
                value={config.company_address}
                onChange={(e) => updateField("company_address", e.target.value)}
                placeholder="Musterstraße 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="company_postal_code">PLZ *</Label>
                <Input
                  id="company_postal_code"
                  value={config.company_postal_code}
                  onChange={(e) => updateField("company_postal_code", e.target.value)}
                  placeholder="10115"
                />
              </div>
              <div>
                <Label htmlFor="company_city">Stadt *</Label>
                <Input
                  id="company_city"
                  value={config.company_city}
                  onChange={(e) => updateField("company_city", e.target.value)}
                  placeholder="Berlin"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company_country">Land</Label>
              <Input
                id="company_country"
                value={config.company_country}
                onChange={(e) => updateField("company_country", e.target.value)}
                placeholder="Deutschland"
              />
            </div>
            <div>
              <Label htmlFor="company_email">E-Mail *</Label>
              <Input
                id="company_email"
                type="email"
                value={config.company_email}
                onChange={(e) => updateField("company_email", e.target.value)}
                placeholder="info@monvesta.de"
              />
            </div>
            <div>
              <Label htmlFor="company_phone">Telefon</Label>
              <Input
                id="company_phone"
                value={config.company_phone}
                onChange={(e) => updateField("company_phone", e.target.value)}
                placeholder="+49 30 12345678"
              />
            </div>
            <div>
              <Label htmlFor="company_vat_id">USt-IdNr. *</Label>
              <Input
                id="company_vat_id"
                value={config.company_vat_id}
                onChange={(e) => updateField("company_vat_id", e.target.value)}
                placeholder="DE123456789"
              />
            </div>
            <div>
              <Label htmlFor="company_registration">Handelsregister</Label>
              <Input
                id="company_registration"
                value={config.company_registration}
                onChange={(e) => updateField("company_registration", e.target.value)}
                placeholder="HRB 12345 B, AG Berlin"
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Bank Details */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">
            Bankverbindung
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bankname *</Label>
              <Input
                id="bank_name"
                value={config.bank_name}
                onChange={(e) => updateField("bank_name", e.target.value)}
                placeholder="Deutsche Bank"
              />
            </div>
            <div>
              <Label htmlFor="bank_iban">IBAN *</Label>
              <Input
                id="bank_iban"
                value={config.bank_iban}
                onChange={(e) => updateField("bank_iban", e.target.value)}
                placeholder="DE89 3704 0044 0532 0130 00"
              />
            </div>
            <div>
              <Label htmlFor="bank_bic">BIC *</Label>
              <Input
                id="bank_bic"
                value={config.bank_bic}
                onChange={(e) => updateField("bank_bic", e.target.value)}
                placeholder="COBADEFFXXX"
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Invoice Settings */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-4">
            Rechnungseinstellungen
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_prefix">Rechnungsnummer-Prefix</Label>
              <Input
                id="invoice_prefix"
                value={config.invoice_prefix}
                onChange={(e) => updateField("invoice_prefix", e.target.value)}
                placeholder="RE"
              />
              <Text size="small" className="text-ui-fg-subtle mt-1">
                Format: RE-2026-0001
              </Text>
            </div>
            <div>
              <Label htmlFor="default_tax_rate">Standard-Steuersatz (%)</Label>
              <Input
                id="default_tax_rate"
                type="number"
                value={String(config.default_tax_rate)}
                onChange={(e) =>
                  updateField("default_tax_rate", parseFloat(e.target.value) || 0)
                }
                placeholder="19"
              />
            </div>
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={config.logo_url}
                onChange={(e) => updateField("logo_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="footer_text">Fußzeile / Hinweistext</Label>
              <Textarea
                id="footer_text"
                value={config.footer_text}
                onChange={(e) => updateField("footer_text", e.target.value)}
                placeholder="Vielen Dank für Ihr Vertrauen. Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4">
          <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
            Speichern
          </Button>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Rechnungen",
  icon: DocumentText,
})

export default InvoiceConfigPage
