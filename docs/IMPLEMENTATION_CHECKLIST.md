# PDF/A-3 E-Rechnung - Implementierungs-Checkliste

## ✅ Abgeschlossen

- [x] InvoiceData Interface definiert (Single Source of Truth)
- [x] ZUGFeRD XML Generator (EN 16931 konform)
- [x] XRechnung XML Generator
- [x] Frontend PDF Preview mit jsPDF
- [x] Frontend/Backend Integration Wrapper
- [x] Laravel Controller Methoden
- [x] API Routes
- [x] Dokumentation

## 🔄 In Arbeit / Offen

### Backend (Laravel)

- [ ] Java Service Setup (iText 7)
  - [ ] Maven Projekt erstellen
  - [ ] Dependencies konfigurieren
  - [ ] PDF/A-3 Generator implementieren
  - [ ] JAR-Datei kompilieren
  - [ ] Integration in Laravel

- [ ] Alternative: PHP PDF/A-3 Lösung evaluieren
  - [ ] TCPDF / FPDF mit PDF/A-3 Support prüfen
  - [ ] Externe Services (z.B. PDFTron, Adobe PDF Services)

- [ ] InvoiceData Builder in PHP
  - [ ] TypeScript Logik nach PHP portieren
  - [ ] buildInvoiceData() Methode

- [ ] Error Handling
  - [ ] Validierung von InvoiceData
  - [ ] Fehlerbehandlung bei Java Service
  - [ ] Fallback-Mechanismen

### Frontend (Vue 3)

- [ ] UI für E-Rechnung Export
  - [ ] Button "E-Rechnung (PDF/A-3) generieren"
  - [ ] Button "XRechnung (XML) generieren"
  - [ ] Loading States
  - [ ] Error Messages

- [ ] Preview vs. Final Export
  - [ ] Preview weiterhin mit jsPDF
  - [ ] Final Export über Backend API

- [ ] XRechnung Export
  - [ ] generateXRechnung() Funktion aufrufen
  - [ ] XML Download

### Testing & Validierung

- [ ] PDF/A-3 Validierung
  - [ ] veraPDF Integration
  - [ ] Automatische Tests
  - [ ] Manuelle Validierung

- [ ] ZUGFeRD Validierung
  - [ ] KoSIT Validator Integration
  - [ ] EN 16931 Konformität prüfen

- [ ] XRechnung Validierung
  - [ ] XRechnung Validator
  - [ ] CII D16B Konformität

### Dokumentation

- [ ] Deployment Guide
  - [ ] Java Runtime Setup
  - [ ] JAR-Datei Deployment
  - [ ] Environment Variables

- [ ] User Guide
  - [ ] Wie E-Rechnung generieren
  - [ ] Unterschied Preview vs. Final
  - [ ] XRechnung für Behörden

## 📋 Technische Details

### Java Service Setup

1. **Maven Projekt erstellen:**
```bash
mvn archetype:generate -DgroupId=com.galifloor.invoice \
  -DartifactId=pdfa3-generator \
  -DarchetypeArtifactId=maven-archetype-quickstart
```

2. **pom.xml Dependencies:**
```xml
<dependencies>
    <dependency>
        <groupId>com.itextpdf</groupId>
        <artifactId>itext7-core</artifactId>
        <version>7.2.5</version>
    </dependency>
    <dependency>
        <groupId>com.itextpdf</groupId>
        <artifactId>itext7-pdfa</artifactId>
        <version>7.2.5</version>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.15.2</version>
    </dependency>
</dependencies>
```

3. **JAR kompilieren:**
```bash
mvn clean package
```

4. **JAR nach Laravel Projekt kopieren:**
```bash
cp target/pdfa3-generator.jar /path/to/galifloor/java/
```

### Environment Variables (.env)

```env
# PDF/A-3 Java Service
PDFA3_JAVA_SERVICE_URL=http://localhost:8080/generate-pdfa3
PDFA3_JAR_PATH=/path/to/pdfa3-generator.jar
```

### API Endpoints

- `POST /api/invoices/{id}/generate-erechnung`
  - Request Body: `{ invoiceData: {...}, zugferdXML: "..." }`
  - Response: PDF/A-3 Byte-Stream

- `POST /api/invoices/{id}/generate-xrechnung`
  - Request Body: `{ invoiceData: {...}, xrechnungXML: "..." }`
  - Response: XRechnung XML

## 🎯 Prioritäten

1. **Hoch**: Java Service Setup und Integration
2. **Hoch**: Frontend UI für E-Rechnung Export
3. **Mittel**: InvoiceData Builder in PHP (optional, wenn Frontend sendet)
4. **Mittel**: Validierungstests
5. **Niedrig**: Alternative PHP-Lösungen evaluieren

## 📝 Notizen

- **PDF/A-3 ist NICHT mit pdf-lib möglich** - Java Service erforderlich
- **XRechnung ist reines XML** - Kein PDF nötig
- **Preview kann jsPDF bleiben** - Nur Final Export braucht PDF/A-3
- **InvoiceData bleibt Single Source of Truth** - Alle Generatoren verwenden es
