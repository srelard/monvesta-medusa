import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Container, Heading, Text, Button, Drawer, Input, Textarea, IconButton } from "@medusajs/ui"
import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import { useState, useCallback } from "react"

// ─── Types ───
interface Feature { title: string; description: string }
interface Module { title: string; duration: string; lessons: string }
interface Testimonial { name: string; text: string; rating: number }
interface FAQ { q: string; a: string }

interface ProductMetadata {
  badge?: string
  trust_badges?: string[]
  stats?: { value: string; label: string }[]
  features?: Feature[]
  modules?: Module[]
  audience?: string[]
  testimonials?: Testimonial[]
  faqs?: FAQ[]
}

// ─── Widget ───
const ProductMetadataWidget = ({ data: product }: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const [open, setOpen] = useState(false)
  const meta = (product.metadata || {}) as ProductMetadata

  const hasContent = meta.badge || meta.features?.length || meta.modules?.length ||
    meta.testimonials?.length || meta.faqs?.length || meta.audience?.length

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Produktseite Inhalte</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Marketing-Inhalte fuer die Produktdetailseite
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
          <PencilSquare />
          Bearbeiten
        </Button>
      </div>

      <div className="px-6 py-4">
        {!hasContent ? (
          <Text size="small" className="text-ui-fg-subtle">
            Noch keine Marketing-Inhalte hinterlegt. Klicke auf "Bearbeiten" um Inhalte hinzuzufuegen.
          </Text>
        ) : (
          <div className="space-y-3">
            {meta.badge && (
              <MetaRow label="Badge" value={meta.badge} />
            )}
            {meta.trust_badges && meta.trust_badges.length > 0 && (
              <MetaRow label="Trust Badges" value={meta.trust_badges.join(", ")} />
            )}
            {meta.features && meta.features.length > 0 && (
              <MetaRow label="Features" value={`${meta.features.length} Eintraege`} />
            )}
            {meta.modules && meta.modules.length > 0 && (
              <MetaRow label="Module" value={`${meta.modules.length} Module`} />
            )}
            {meta.audience && meta.audience.length > 0 && (
              <MetaRow label="Zielgruppe" value={`${meta.audience.length} Punkte`} />
            )}
            {meta.testimonials && meta.testimonials.length > 0 && (
              <MetaRow label="Testimonials" value={`${meta.testimonials.length} Bewertungen`} />
            )}
            {meta.faqs && meta.faqs.length > 0 && (
              <MetaRow label="FAQs" value={`${meta.faqs.length} Fragen`} />
            )}
          </div>
        )}
      </div>

      <MetadataDrawer
        open={open}
        onClose={() => setOpen(false)}
        productId={product.id}
        metadata={meta}
      />
    </Container>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <Text size="small" weight="plus">{label}</Text>
      <Text size="small" className="text-ui-fg-subtle">{value}</Text>
    </div>
  )
}

// ─── Drawer ───
function MetadataDrawer({
  open,
  onClose,
  productId,
  metadata,
}: {
  open: boolean
  onClose: () => void
  productId: string
  metadata: ProductMetadata
}) {
  const [saving, setSaving] = useState(false)
  const [badge, setBadge] = useState(metadata.badge || "")
  const [trustBadges, setTrustBadges] = useState<string[]>(metadata.trust_badges || [])
  const [features, setFeatures] = useState<Feature[]>(metadata.features || [])
  const [modules, setModules] = useState<Module[]>(metadata.modules || [])
  const [audience, setAudience] = useState<string[]>(metadata.audience || [])
  const [testimonials, setTestimonials] = useState<Testimonial[]>(metadata.testimonials || [])
  const [faqs, setFaqs] = useState<FAQ[]>(metadata.faqs || [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const updatedMetadata: Record<string, unknown> = {
        ...(metadata as Record<string, unknown>),
        badge: badge || undefined,
        trust_badges: trustBadges.length > 0 ? trustBadges : undefined,
        features: features.length > 0 ? features : undefined,
        modules: modules.length > 0 ? modules : undefined,
        audience: audience.length > 0 ? audience : undefined,
        testimonials: testimonials.length > 0 ? testimonials : undefined,
        faqs: faqs.length > 0 ? faqs : undefined,
      }

      await fetch(`/admin/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metadata: updatedMetadata }),
      })

      onClose()
      window.location.reload()
    } catch (err) {
      console.error("Save error:", err)
      alert("Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }, [badge, trustBadges, features, modules, audience, testimonials, faqs, productId, metadata, onClose])

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Content className="overflow-y-auto">
        <Drawer.Header>
          <Drawer.Title>Produktseite Inhalte bearbeiten</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="space-y-8 pb-8">

          {/* Badge */}
          <Section title="Badge">
            <Input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="z.B. Online-Kurs, Premium, Tool"
            />
          </Section>

          {/* Trust Badges */}
          <Section title="Trust Badges">
            <StringListEditor items={trustBadges} onChange={setTrustBadges} placeholder="z.B. 14 Tage Geld-zurueck" />
          </Section>

          {/* Features */}
          <Section title="Features">
            {features.map((f, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="flex-1 space-y-1">
                  <Input size="small" value={f.title} onChange={(e) => {
                    const updated = [...features]; updated[i] = { ...f, title: e.target.value }; setFeatures(updated)
                  }} placeholder="Titel" />
                  <Input size="small" value={f.description} onChange={(e) => {
                    const updated = [...features]; updated[i] = { ...f, description: e.target.value }; setFeatures(updated)
                  }} placeholder="Beschreibung" />
                </div>
                <IconButton size="small" variant="transparent" onClick={() => setFeatures(features.filter((_, j) => j !== i))}>
                  <Trash />
                </IconButton>
              </div>
            ))}
            <Button size="small" variant="secondary" onClick={() => setFeatures([...features, { title: "", description: "" }])}>
              <Plus /> Feature hinzufuegen
            </Button>
          </Section>

          {/* Modules */}
          <Section title="Module">
            {modules.map((m, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="flex-1 space-y-1">
                  <Input size="small" value={m.title} onChange={(e) => {
                    const updated = [...modules]; updated[i] = { ...m, title: e.target.value }; setModules(updated)
                  }} placeholder="Modultitel" />
                  <div className="flex gap-2">
                    <Input size="small" value={m.duration} onChange={(e) => {
                      const updated = [...modules]; updated[i] = { ...m, duration: e.target.value }; setModules(updated)
                    }} placeholder="Dauer" />
                    <Input size="small" value={m.lessons} onChange={(e) => {
                      const updated = [...modules]; updated[i] = { ...m, lessons: e.target.value }; setModules(updated)
                    }} placeholder="Lektionen" />
                  </div>
                </div>
                <IconButton size="small" variant="transparent" onClick={() => setModules(modules.filter((_, j) => j !== i))}>
                  <Trash />
                </IconButton>
              </div>
            ))}
            <Button size="small" variant="secondary" onClick={() => setModules([...modules, { title: "", duration: "", lessons: "" }])}>
              <Plus /> Modul hinzufuegen
            </Button>
          </Section>

          {/* Audience */}
          <Section title="Zielgruppe">
            <StringListEditor items={audience} onChange={setAudience} placeholder="z.B. Du willst endlich investieren" />
          </Section>

          {/* Testimonials */}
          <Section title="Testimonials">
            {testimonials.map((t, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="flex-1 space-y-1">
                  <Input size="small" value={t.name} onChange={(e) => {
                    const updated = [...testimonials]; updated[i] = { ...t, name: e.target.value }; setTestimonials(updated)
                  }} placeholder="Name" />
                  <Textarea value={t.text} onChange={(e) => {
                    const updated = [...testimonials]; updated[i] = { ...t, text: e.target.value }; setTestimonials(updated)
                  }} placeholder="Bewertungstext" />
                  <Input size="small" type="number" min={1} max={5} value={String(t.rating)} onChange={(e) => {
                    const updated = [...testimonials]; updated[i] = { ...t, rating: Number(e.target.value) }; setTestimonials(updated)
                  }} placeholder="Rating (1-5)" />
                </div>
                <IconButton size="small" variant="transparent" onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}>
                  <Trash />
                </IconButton>
              </div>
            ))}
            <Button size="small" variant="secondary" onClick={() => setTestimonials([...testimonials, { name: "", text: "", rating: 5 }])}>
              <Plus /> Testimonial hinzufuegen
            </Button>
          </Section>

          {/* FAQs */}
          <Section title="FAQs">
            {faqs.map((f, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="flex-1 space-y-1">
                  <Input size="small" value={f.q} onChange={(e) => {
                    const updated = [...faqs]; updated[i] = { ...f, q: e.target.value }; setFaqs(updated)
                  }} placeholder="Frage" />
                  <Textarea value={f.a} onChange={(e) => {
                    const updated = [...faqs]; updated[i] = { ...f, a: e.target.value }; setFaqs(updated)
                  }} placeholder="Antwort" />
                </div>
                <IconButton size="small" variant="transparent" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                  <Trash />
                </IconButton>
              </div>
            ))}
            <Button size="small" variant="secondary" onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>
              <Plus /> FAQ hinzufuegen
            </Button>
          </Section>

        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Abbrechen</Button>
          </Drawer.Close>
          <Button onClick={handleSave} isLoading={saving}>
            Speichern
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

// ─── Helpers ───
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Text size="small" weight="plus" className="mb-2">{title}</Text>
      {children}
    </div>
  )
}

function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <Input
            size="small"
            value={item}
            onChange={(e) => {
              const updated = [...items]
              updated[i] = e.target.value
              onChange(updated)
            }}
            placeholder={placeholder}
          />
          <IconButton size="small" variant="transparent" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash />
          </IconButton>
        </div>
      ))}
      <Button size="small" variant="secondary" onClick={() => onChange([...items, ""])}>
        <Plus /> Hinzufuegen
      </Button>
    </div>
  )
}

// ─── Config ───
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMetadataWidget
