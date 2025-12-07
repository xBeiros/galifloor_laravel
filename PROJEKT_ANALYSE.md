# Projektanalyse: Galifloor Laravel

## 📋 Übersicht

**Projektname:** galifloor_laravel  
**Typ:** Laravel-basierte Webanwendung mit Vue.js Frontend  
**Architektur:** Monolithische SPA (Single Page Application) mit Inertia.js

---

## 🏗️ Technologie-Stack

### Backend
- **Framework:** Laravel (PHP 8.2+)
- **Authentifizierung:** Laravel Breeze + Sanctum
- **PDF-Generierung:** DomPDF
- **Routing:** Inertia.js für SPA-Funktionalität
- **Zusatzpakete:**
  - `tightenco/ziggy` - Route-Helper für JavaScript
  - `inertiajs/inertia-laravel` - Inertia.js Integration

### Frontend
- **Framework:** Vue.js 3.4+ mit TypeScript
- **Build-Tool:** Vite 6.0
- **Styling:** Tailwind CSS 3.2
- **State Management:** Pinia
- **Formular-Validierung:** Vee-Validate + Yup
- **Internationalisierung:** Vue-i18n (Deutsch & Türkisch)
- **PDF-Bearbeitung:** jsPDF, pdf-lib
- **UI-Komponenten:** Headless UI, Heroicons
- **Datum/Zeit:** Day.js

---

## 📊 Datenmodell & Entitäten

### Hauptentitäten

#### 1. **Company (Firma)**
- Verwaltung von Kundenfirmen
- Felder: Name, Adresse, E-Mail, Steuernummer, Sicherheitsdienst, Skonto
- Beziehungen: 
  - `hasMany` Invoices
  - `hasMany` CompanyDocuments

#### 2. **Invoice (Rechnung)**
- Rechnungsverwaltung mit automatischer Nummerierung
- Automatische Generierung von `year` und `order_number`
- Status-Workflow: `in_progress` → `waiting_for_invoice` → `invoice_sent` → `completed` / `canceled`
- Felder: Projektnummer, Baustelle, Adresse, Datumsfelder (start_date, end_date, issued_at)
- Beziehungen:
  - `belongsTo` Company
  - `hasMany` Performances
  - `hasMany` Assets

#### 3. **Performance (Leistung)**
- Leistungspositionen für Rechnungen
- Felder: Beschreibung, Datum, Enddatum, QM, Preis, Pauschale, Status
- Tracking: `modified_after_issue` (Änderungen nach Rechnungsstellung)
- Beziehung: `belongsTo` Invoice

#### 4. **Employee (Mitarbeiter)**
- Personalverwaltung
- Umfangreiche Felder: Persönliche Daten, Bankdaten, Sozialversicherung, Arbeitsvertrag
- Status: `active`, `terminated`, `on_leave`
- Beziehungen:
  - `hasMany` EmployeeDocuments
  - Bildverwaltung mit `image_path` und `image_url` Accessor

#### 5. **Vehicle (Fahrzeug)**
- Fahrzeugverwaltung
- Beziehungen:
  - `hasMany` VehicleDocuments

#### 6. **Asset**
- Datei-Uploads für Rechnungen
- Beziehung: `belongsTo` Invoice

#### 7. **Document (Dokument)**
- Allgemeine Dokumentenverwaltung
- Separate Tabellen für:
  - `CompanyDocument`
  - `EmployeeDocument`
  - `VehicleDocument`

#### 8. **IvehaInvoice**
- Spezielle Rechnungsart (vermutlich für IVEHA-Format)
- Separate Tabelle und Controller

#### 9. **OwnCompany**
- Eigene Firmendaten
- Verwaltung der eigenen Unternehmensinformationen

---

## 🎯 Funktionalitäten

### Kernfunktionen

1. **Rechnungsverwaltung**
   - Erstellung und Verwaltung von Rechnungen
   - Automatische Rechnungsnummerierung (Jahr + fortlaufende Nummer)
   - Rechnungsstatus-Workflow
   - PDF-Generierung und E-Mail-Versand
   - IVEHA-Rechnungen (separates Format)

2. **Leistungsverwaltung**
   - Erfassung von Leistungspositionen
   - QM- und Preisverwaltung
   - Datumsverwaltung mit Enddatum
   - Status-Tracking
   - Änderungshistorie nach Rechnungsstellung

3. **Firmenverwaltung**
   - Kundenfirmen-Verwaltung
   - Eigene Firmendaten
   - Dokumentenverwaltung pro Firma

4. **Personalverwaltung**
   - Mitarbeiterstammdaten
   - Dokumentenverwaltung
   - Bildverwaltung
   - Bescheinigungsgenerierung (clientseitig mit jsPDF)

5. **Fahrzeugverwaltung**
   - Fahrzeugstammdaten
   - Dokumentenverwaltung

6. **Kalender**
   - Kalenderansicht (CalendarController)

7. **Dashboard**
   - Übersichtsseite

8. **Dokumentenverwaltung**
   - Zentrale Dokumentenverwaltung
   - Download-Funktionalität

---

## 🗂️ Projektstruktur

### Backend-Struktur
```
app/
├── Http/
│   ├── Controllers/        # 23 Controller
│   ├── Middleware/         # CORS, Inertia
│   └── Requests/           # Form Requests
├── Models/                 # 12 Eloquent Models
├── Mail/                   # E-Mail-Klassen
└── Providers/              # Service Provider
```

### Frontend-Struktur
```
resources/js/
├── Pages/                  # 24 Vue-Seiten
│   ├── Auth/              # Authentifizierung
│   ├── Company/           # Firmenverwaltung
│   ├── Employee/          # Personalverwaltung
│   ├── Invoice/           # Rechnungen
│   ├── Vehicle/           # Fahrzeuge
│   └── ...
├── Components/            # 20 Vue-Komponenten
├── Composables/           # 6 TypeScript Composables
├── Layouts/               # 2 Layout-Komponenten
├── store/                 # Pinia Store
├── types/                 # TypeScript Typen
└── i18n/                  # Internationalisierung
```

### Datenbank
- **Migrations:** 20+ Migrations
- **Seeders:** DatabaseSeeder, OwnCompanySeeder

---

## 🔐 Authentifizierung & Sicherheit

- **Laravel Breeze** für Authentifizierung
- **Laravel Sanctum** für API-Authentifizierung
- **E-Mail-Verifizierung** implementiert
- **Middleware:** `auth`, `verified` für geschützte Routen
- **CORS-Middleware** vorhanden

---

## 🌍 Internationalisierung

- **Unterstützte Sprachen:** Deutsch (Standard), Türkisch
- **Implementierung:** Vue-i18n
- **Sprachumschaltung:** `/language/{locale}` Route
- **Speicherung:** LocalStorage

---

## 🎨 UI/UX Features

- **Dark Mode** - System-Präferenz + LocalStorage
- **Responsive Design** - Tailwind CSS
- **Formular-Validierung** - Vee-Validate + Yup
- **Icons** - Heroicons
- **Komponenten** - Headless UI

---

## 📝 Code-Qualität & Best Practices

### Positive Aspekte:
✅ Klare MVC-Struktur  
✅ Eloquent Relationships gut definiert  
✅ TypeScript für Type-Safety  
✅ Form Requests für Validierung  
✅ Middleware für Authentifizierung  
✅ Internationalisierung implementiert  

### Verbesserungspotenzial:
⚠️ **Debug-Routen** in `web.php` (Zeilen 28-86) sollten entfernt werden  
⚠️ **Code-Duplikation** in API-Routen (`api.php` vs `web.php`)  
⚠️ **Fehlende API-Versionierung**  
⚠️ **Kommentierte Routen** (Zeilen 149-151 in `web.php`) sollten entfernt werden  
⚠️ **Fehlende Request-Klassen** für einige Controller-Methoden  
⚠️ **Fehlende Tests** für Business-Logic (nur Auth-Tests vorhanden)  

---

## 🚀 Deployment & Entwicklung

### Entwicklung
- **Composer Script:** `composer dev` startet Server, Queue und Vite parallel
- **Vite** für Frontend-Development
- **Laravel Queue** für Background-Jobs

### Dependencies
- **PHP:** ^8.2
- **Node.js:** (nicht spezifiziert, aber Vite 6.0 benötigt Node 18+)

---

## 📦 Wichtige Pakete

### Backend
- `dompdf/dompdf` - PDF-Generierung
- `inertiajs/inertia-laravel` - SPA-Framework
- `tightenco/ziggy` - Route-Helper

### Frontend
- `@inertiajs/vue3` - Inertia.js Vue-Adapter
- `pinia` - State Management
- `vue-i18n` - Internationalisierung
- `jspdf` + `pdf-lib` - PDF-Bearbeitung
- `vee-validate` + `yup` - Formular-Validierung

---

## 🔍 Besondere Features

1. **Automatische Rechnungsnummerierung**
   - Jahr + fortlaufende Nummer
   - Implementiert in `Invoice::boot()`

2. **Änderungshistorie bei Leistungen**
   - `modified_after_issue` Flag
   - Tracking von Änderungen nach Rechnungsstellung

3. **Clientseitige PDF-Generierung**
   - Bescheinigungen werden mit jsPDF im Browser generiert
   - Keine Server-Last für PDF-Generierung

4. **Bildverwaltung für Mitarbeiter**
   - Storage-Integration
   - Fallback auf Default-Bild

---

## 📈 Geschäftszweck

Das Projekt scheint eine **Bau-/Handwerksbetriebsverwaltung** zu sein mit Fokus auf:
- Rechnungsstellung
- Leistungserfassung
- Personalverwaltung
- Fahrzeugverwaltung
- Dokumentenmanagement

---

## 🎯 Empfohlene nächste Schritte

1. **Code-Bereinigung:**
   - Debug-Routen entfernen
   - Kommentierte Code-Zeilen entfernen
   - API-Routen konsolidieren

2. **Testing:**
   - Unit-Tests für Models
   - Feature-Tests für Controller
   - Frontend-Tests (Vitest)

3. **Dokumentation:**
   - API-Dokumentation
   - Code-Kommentare erweitern
   - README aktualisieren

4. **Performance:**
   - Eager Loading optimieren
   - Caching-Strategien
   - Query-Optimierung

5. **Sicherheit:**
   - Rate Limiting
   - Input-Sanitization prüfen
   - CSRF-Schutz sicherstellen

---

## 📊 Statistiken

- **Controller:** 23
- **Models:** 12
- **Migrations:** 20+
- **Vue-Komponenten:** 20+
- **Vue-Seiten:** 24
- **Routes:** ~50+ (Web + API)
- **Sprachen:** 2 (DE, TR)

---

*Analyse erstellt am: $(date)*

