# Architektur-Review & Refactoring — Juli 2026

Vollständiges Code-Review des Medusa-Backends (Stand: `8e71a92`), durchgeführt am 06.07.2026.
Alle hier als „umgesetzt" markierten Punkte sind in den Commits dieses Reviews enthalten.

## 1. Architektur-Überblick

Headless Medusa-2.13-Backend mit drei Custom-Modulen:

| Modul | Zweck | Modelle |
|---|---|---|
| `invoice` | Deutsche Rechnungen (DIN 5008, §14 UStG) mit PDF-Generierung (pdfmake) | `Invoice`, `InvoiceItem`, `InvoiceConfig` (Singleton) |
| `product-content` | Übersetzbare Marketing-Inhalte für Produktseiten | `ProductContent` + 7 Kind-Tabellen (Badges, Stats, Features, Module, Zielgruppe, Testimonials, FAQs) |
| `paypal` | Custom Payment Provider (`AbstractPaymentProvider`) über das PayPal Server SDK | — |

**Zentraler Datenfluss (Bestellung → Rechnung → E-Mail):**

```
Checkout abgeschlossen
  → Event "order.placed"
  → Subscriber (src/subscribers/order-placed.ts)
      1. generateInvoiceWorkflow:
         Order laden → Config laden → Invoice + Items anlegen
         → PDF rendern → Upload (File-Modul: S3/Supabase bzw. lokal)
         → Remote-Link Invoice ↔ Order
      2. sendOrderWebhookWorkflow:
         Order + Invoice-URL an n8n-Webhook (verschickt Bestellbestätigung)
```

Admin-Widgets (`order-invoice`, `product-metadata`) sprechen Custom-`/admin`-Routen an;
das Storefront liest `/store/products/:id/content` (gecacht) und `/store/orders/:id/invoice`.
Infrastruktur (Redis, S3, Payment-Provider) wird in `medusa-config.ts` env-gesteuert aktiviert.

## 2. Findings

### Kritisch

| # | Finding | Status |
|---|---|---|
| K1 | **Race Condition in der Rechnungsnummernvergabe.** `getNextInvoiceNumber` machte Read-Max-then-Insert ohne Sperre. Zwei gleichzeitige Bestellungen → gleiche `display_id` → Unique-Index-Verletzung → komplette Rechnungserzeugung schlägt fehl (rechtlich relevant: fortlaufende Nummerierung). | ✅ Umgesetzt: `createInvoiceWithNextNumber()` mit Retry bei Unique-Verletzung (max. 5 Versuche), abgesichert durch Unit-Tests. |
| K2 | **`GET /store/orders/:id/invoice` war unauthentifiziert.** Jeder mit einer Order-ID bekam die Rechnungs-URL (Name, Adresse, USt-ID → DSGVO). | ✅ Umgesetzt: Ownership-Check — eingeloggter Customer der Order **oder** `?email=` muss zur Order-E-Mail passen. ⚠️ Breaking für künftige Storefront-Aufrufe (aktuell ruft das Storefront den Endpoint noch nicht auf). |
| K3 | **Reverse Charge nur anhand USt-ID.** Auch deutsche B2B-Kunden mit USt-ID bekamen einen §13b-Ausweis mit 0 % USt — inkonsistentes Dokument. | ✅ Umgesetzt: `isReverseChargeCustomer()` prüft EU-Land ≠ DE (inkl. `EL`/`XI`-Präfixe); Land wird als `customer_country_code` auf der Rechnung gespeichert (neue Migration), Fallback: USt-ID-Präfix. |
| K4 | **PayPal-Webhook-Verifikation wurde ohne `PAYPAL_WEBHOOK_ID` übersprungen** (nur Warn-Log) — gefälschte Payment-Webhooks wären akzeptiert worden. | ✅ Umgesetzt: In `environment=production` fail-closed (Webhook wird abgelehnt); Sandbox weiterhin permissiv für lokale Entwicklung. |

### Architektur / Duplikation

| # | Finding | Status |
|---|---|---|
| A1 | **Upsert-Logik in 3 Kopien** (Admin-Route inline, Workflow-Step, Migrationsskript) mit bereits vorhandenem Drift (parallel vs. sequenziell, `original_price`-Semantik). | ✅ Konsolidiert in `ProductContentModuleService.upsertContent()` — alle drei Aufrufer delegieren. |
| A2 | **Route-zu-Route-Import:** Die Admin-Route importierte die Cache-`Map` aus der Store-Route-Datei. | ✅ Cache nach `src/lib/product-content-cache.ts` extrahiert. |
| A3 | **Toter Workflow:** `upsertProductContentWorkflow` wurde nirgends aufgerufen; die Admin-Route duplizierte seine Logik inline. | ✅ Admin-POST läuft jetzt durch den Workflow (Link-Erstellung wird bei Fehlern kompensiert). |
| A4 | **Default-Invoice-Config doppelt gepflegt** (Workflow-Transform vs. `getOrCreateConfig`), bereits auseinandergedriftet. | ✅ Eine Quelle: `DEFAULT_INVOICE_CONFIG` in `src/modules/invoice/constants.ts`. |
| A5 | **Nicht-atomarer Child-Replace:** Kinder löschen + neu anlegen ohne Transaktion — Absturz dazwischen = Datenverlust. | ✅ `upsertContent` läuft via `@InjectTransactionManager` in einer DB-Transaktion. |

### Skalierung / Performance

| # | Finding | Status |
|---|---|---|
| S1 | **In-Process-Cache überlebt keine Skalierung.** Invalidierung per Admin-Save erreichte nur den eigenen Prozess (Server/Worker-Split, mehrere Instanzen → bis 24 h stale). | ✅ Cache nutzt jetzt das Caching-Modul (`Modules.CACHING`, Redis in Production laut `medusa-config.ts`); In-Process-Fallback nur für lokalen Dev ohne Redis. |
| S2 | **PayPal-OAuth-Token pro Webhook neu geholt** (2 zusätzliche HTTP-Roundtrips pro Event). | ✅ Token wird bis 60 s vor Ablauf gecacht. |
| S3 | **n8n-Webhook ohne Retry** — transienter Ausfall = verlorene Bestellbestätigung (nur Log). | ✅ Eigener `sendOrderWebhookWorkflow` mit `maxRetries: 3`, `retryInterval: 10s`. |

### Wartbarkeit

| # | Finding | Status |
|---|---|---|
| W1 | Keine Request-Validierung (`req.body as any` überall); `POST /admin/invoice-config` spreadete beliebige Keys ins Update. | ✅ Zod-Schemas via `validateAndTransformBody` in `src/api/middlewares.ts` (unbekannte Keys werden gestrippt). |
| W2 | `console.log` statt Logger, Timing-Debug-Reste in Routen, PDF-Generator mutierte sein Input-Objekt. | ✅ Container-Logger überall; PDF-Funktion mutationsfrei. |
| W3 | Keine Tests außer Health-Check. | ✅ 16 Unit-Tests für Rechnungsnummerierung, Reverse-Charge-Logik und Content-Upsert (`npm run test:unit`). Modul-Integrationstests mit DB stehen noch aus (siehe unten). |

## 3. Betriebs-Hinweise (Deployment)

1. **Neue DB-Migration:** `invoice.customer_country_code` (nullable) — vor dem Start `npx medusa db:migrate` ausführen.
2. **`PAYPAL_WEBHOOK_ID` ist in Production jetzt Pflicht** — ohne sie werden PayPal-Webhooks abgelehnt (vorher: stillschweigend akzeptiert).
3. **Storefront-Anbindung Rechnungs-Download:** `GET /store/orders/:id/invoice` verlangt jetzt entweder eine Customer-Session, die zur Order gehört, oder `?email=<Bestell-E-Mail>`.
4. Bestandsrechnungen ohne `customer_country_code` nutzen als Fallback das USt-ID-Präfix (z. B. `ATU…` → AT) für die Reverse-Charge-Entscheidung.

## 4. Offene Empfehlungen (bewusst nicht umgesetzt)

1. **Modul-Integrationstests mit echter DB** (`npm run test:integration:modules` / `@medusajs/test-utils`) für `upsertContent` und die Rechnungsnummerierung unter echter Parallelität — benötigt lokales Postgres bzw. CI-Datenbank.
2. **Lückenlose Nummerierung streng genommen:** Die Kompensation des `create-invoice`-Steps löscht bei Fehlern die Rechnung → Nummernlücke möglich. Für strikte GoBD-Konformität wäre ein Storno-Status statt Löschung sauberer (gilt auch für den Invoice-Delete-Button im Admin).
3. **PayPal-Provider entschlacken:** Die 9 fast identischen try/catch-Wrapper könnten in einen Helper wandern — bewusst zurückgestellt, bis Integrationstests den Payment-Pfad absichern.
4. **`getPaymentStatus` schluckt alle Fehler** und liefert `pending` — sollte mindestens loggen.
5. **Webhook-Betrag-Fallback `|| 0`** in `getWebhookActionAndData`: fehlender Betrag wird als 0 gemeldet statt als Fehler.
6. **pdfmake-Typen:** `TDocumentDefinitions` ist als `any` aliased; `pdfmake/interfaces` liefert echte Typen, erzeugt aber Friktion mit den Canvas-/Background-Shapes.
