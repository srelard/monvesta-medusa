import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Container, Heading, Text, Button, Drawer, Input, Textarea, IconButton } from "@medusajs/ui"
import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import { useState, useCallback, useEffect } from "react"

// ─── Types ───
interface Feature { title: string; description: string }
interface CourseModule { title: string; duration: string; lessons: string }
interface Testimonial { name: string; text: string; rating: number }
interface FAQ { question: string; answer: string }
interface Stat { value: string; label: string }

interface ProductContentData {
  badge?: string | null
  sale_label?: string | null
  discount_label?: string | null
  sale_ends_at?: string | null
  original_price?: number | null
  video_url?: string | null
  video_thumbnail?: string | null
  trust_badges?: { label: string }[]
  stats?: Stat[]
  features?: Feature[]
  course_modules?: CourseModule[]
  audience?: { text: string }[]
  testimonials?: Testimonial[]
  faqs?: FAQ[]
}

// ─── Widget ───
const ProductMetadataWidget = ({ data: product }: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ProductContentData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/admin/products/${product.id}/content`, {
        credentials: "include",
      })
      const data = await res.json()
      setContent(data.content || null)
    } catch (err) {
      console.error("Failed to load content:", err)
    } finally {
      setLoading(false)
    }
  }, [product.id])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  const hasContent = content && (
    content.badge || content.features?.length || content.course_modules?.length ||
    content.testimonials?.length || content.faqs?.length || content.audience?.length ||
    content.video_url
  )

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">Inhalte werden geladen...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Produktseite Inhalte</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Marketing-Inhalte für die Produktdetailseite
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
            Noch keine Marketing-Inhalte hinterlegt. Klicke auf "Bearbeiten" um Inhalte hinzuzufügen.
          </Text>
        ) : (
          <div className="space-y-3">
            {content.badge && <MetaRow label="Badge" value={content.badge} />}
            {content.trust_badges && content.trust_badges.length > 0 && (
              <MetaRow label="Trust Badges" value={content.trust_badges.map(b => b.label).join(", ")} />
            )}
            {content.stats && content.stats.length > 0 && (
              <MetaRow label="Stats" value={`${content.stats.length} Einträge`} />
            )}
            {content.features && content.features.length > 0 && (
              <MetaRow label="Features" value={`${content.features.length} Einträge`} />
            )}
            {content.course_modules && content.course_modules.length > 0 && (
              <MetaRow label="Module" value={`${content.course_modules.length} Module`} />
            )}
            {content.audience && content.audience.length > 0 && (
              <MetaRow label="Zielgruppe" value={`${content.audience.length} Punkte`} />
            )}
            {content.testimonials && content.testimonials.length > 0 && (
              <MetaRow label="Testimonials" value={`${content.testimonials.length} Bewertungen`} />
            )}
            {content.faqs && content.faqs.length > 0 && (
              <MetaRow label="FAQs" value={`${content.faqs.length} Fragen`} />
            )}
            {content.video_url && <MetaRow label="Video" value="Vorhanden" />}
          </div>
        )}
      </div>

      <ContentDrawer
        open={open}
        onClose={() => setOpen(false)}
        productId={product.id}
        content={content}
        onSaved={fetchContent}
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
function ContentDrawer({
  open,
  onClose,
  productId,
  content,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  productId: string
  content: ProductContentData | null
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [badge, setBadge] = useState(content?.badge || "")
  const [saleLabel, setSaleLabel] = useState(content?.sale_label || "")
  const [discountLabel, setDiscountLabel] = useState(content?.discount_label || "")
  const [saleEndsAt, setSaleEndsAt] = useState(content?.sale_ends_at || "")
  const [originalPrice, setOriginalPrice] = useState(content?.original_price?.toString() || "")
  const [videoUrl, setVideoUrl] = useState(content?.video_url || "")
  const [videoThumbnail, setVideoThumbnail] = useState(content?.video_thumbnail || "")
  const [trustBadges, setTrustBadges] = useState<string[]>(
    content?.trust_badges?.map(b => b.label) || []
  )
  const [stats, setStats] = useState<Stat[]>(content?.stats || [])
  const [features, setFeatures] = useState<Feature[]>(content?.features || [])
  const [modules, setModules] = useState<CourseModule[]>(content?.course_modules || [])
  const [audience, setAudience] = useState<string[]>(
    content?.audience?.map(a => a.text) || []
  )
  const [testimonials, setTestimonials] = useState<Testimonial[]>(content?.testimonials || [])
  const [faqs, setFaqs] = useState<FAQ[]>(content?.faqs || [])

  // Reset state when content changes (e.g. after save + refetch)
  useEffect(() => {
    setBadge(content?.badge || "")
    setSaleLabel(content?.sale_label || "")
    setDiscountLabel(content?.discount_label || "")
    setSaleEndsAt(content?.sale_ends_at || "")
    setOriginalPrice(content?.original_price?.toString() || "")
    setVideoUrl(content?.video_url || "")
    setVideoThumbnail(content?.video_thumbnail || "")
    setTrustBadges(content?.trust_badges?.map(b => b.label) || [])
    setStats(content?.stats || [])
    setFeatures(content?.features || [])
    setModules(content?.course_modules || [])
    setAudience(content?.audience?.map(a => a.text) || [])
    setTestimonials(content?.testimonials || [])
    setFaqs(content?.faqs || [])
  }, [content])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const body: ProductContentData = {
        badge: badge || null,
        sale_label: saleLabel || null,
        discount_label: discountLabel || null,
        sale_ends_at: saleEndsAt || null,
        original_price: originalPrice ? Number(originalPrice) : null,
        video_url: videoUrl || null,
        video_thumbnail: videoThumbnail || null,
        trust_badges: trustBadges.filter(b => b).map(label => ({ label })),
        stats: stats.filter(s => s.value || s.label),
        features: features.filter(f => f.title || f.description),
        course_modules: modules.filter(m => m.title),
        audience: audience.filter(a => a).map(text => ({ text })),
        testimonials: testimonials.filter(t => t.name || t.text),
        faqs: faqs.filter(f => f.question || f.answer),
      }

      await fetch(`/admin/products/${productId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      onClose()
      onSaved()
    } catch (err) {
      console.error("Save error:", err)
      alert("Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }, [badge, saleLabel, discountLabel, saleEndsAt, originalPrice, videoUrl, videoThumbnail, trustBadges, stats, features, modules, audience, testimonials, faqs, productId, onClose, onSaved])

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Content className="overflow-y-auto">
        <Drawer.Header>
          <Drawer.Title>Produktseite Inhalte bearbeiten</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="space-y-8 pb-8">

          {/* Badge */}
          <Section title="Badge">
            <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="z.B. Online-Kurs, Premium, Tool" />
          </Section>

          {/* Sale / Pricing */}
          <Section title="Angebot / Preis">
            <div className="space-y-2">
              <Input value={saleLabel} onChange={(e) => setSaleLabel(e.target.value)} placeholder="Sale Label (z.B. Angebot)" />
              <Input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="Rabatt Label (z.B. -30%)" />
              <Input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Originalpreis (z.B. 349)" type="number" />
              <Input value={saleEndsAt} onChange={(e) => setSaleEndsAt(e.target.value)} placeholder="Sale endet am (ISO Datum)" type="datetime-local" />
            </div>
          </Section>

          {/* Video */}
          <Section title="Video">
            <div className="space-y-2">
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Video URL (z.B. Mux Stream URL)" />
              <Input value={videoThumbnail} onChange={(e) => setVideoThumbnail(e.target.value)} placeholder="Video Thumbnail URL" />
            </div>
          </Section>

          {/* Trust Badges */}
          <Section title="Trust Badges">
            <StringListEditor items={trustBadges} onChange={setTrustBadges} placeholder="z.B. 14 Tage Geld-zurück" />
          </Section>

          {/* Stats */}
          <Section title="Stats">
            {stats.map((s, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="flex-1 flex gap-2">
                  <Input size="small" value={s.value} onChange={(e) => {
                    const updated = [...stats]; updated[i] = { ...s, value: e.target.value }; setStats(updated)
                  }} placeholder="Wert (z.B. 200+)" />
                  <Input size="small" value={s.label} onChange={(e) => {
                    const updated = [...stats]; updated[i] = { ...s, label: e.target.value }; setStats(updated)
                  }} placeholder="Label (z.B. Teilnehmer)" />
                </div>
                <IconButton size="small" variant="transparent" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
                  <Trash />
                </IconButton>
              </div>
            ))}
            <Button size="small" variant="secondary" onClick={() => setStats([...stats, { value: "", label: "" }])}>
              <Plus /> Stat hinzufügen
            </Button>
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
              <Plus /> Feature hinzufügen
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
              <Plus /> Modul hinzufügen
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
              <Plus /> Testimonial hinzufügen
            </Button>
          </Section>

          {/* FAQs */}
          <Section title="FAQs">
            {faqs.map((f, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <div className="flex-1 space-y-1">
                  <Input size="small" value={f.question} onChange={(e) => {
                    const updated = [...faqs]; updated[i] = { ...f, question: e.target.value }; setFaqs(updated)
                  }} placeholder="Frage" />
                  <Textarea value={f.answer} onChange={(e) => {
                    const updated = [...faqs]; updated[i] = { ...f, answer: e.target.value }; setFaqs(updated)
                  }} placeholder="Antwort" />
                </div>
                <IconButton size="small" variant="transparent" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                  <Trash />
                </IconButton>
              </div>
            ))}
            <Button size="small" variant="secondary" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
              <Plus /> FAQ hinzufügen
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
        <Plus /> Hinzufügen
      </Button>
    </div>
  )
}

// ─── Config ───
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMetadataWidget
