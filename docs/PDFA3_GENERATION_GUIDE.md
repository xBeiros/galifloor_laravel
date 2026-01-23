# PDF/A-3 E-Rechnung Generierung - Vollständiger Guide

## Übersicht

Dieser Guide beschreibt, wie zukunftssichere E-Rechnungen im PDF/A-3 Format mit eingebettetem ZUGFeRD XML generiert werden. Die Lösung unterstützt sowohl B2B (ZUGFeRD) als auch öffentliche Auftraggeber (XRechnung).

## Architektur

### Frontend (Vue 3)
- **Preview-Generierung**: jsPDF für schnelle Vorschau im Browser
- **InvoiceData**: Zentrale Datenquelle für alle Berechnungen
- **ZUGFeRD XML**: Generierung im Frontend möglich

### Backend (Laravel/PHP)
- **PDF/A-3 Generierung**: Serverseitig mit Java/iText oder .NET
- **E-Rechnung Export**: Finale, revisionssichere PDF/A-3 Dateien
- **XRechnung**: Reines XML für Behörden

## PDF/A-3 Anforderungen

### Was ist PDF/A-3?
- **PDF/A-3**: ISO 19005-3 Standard für Langzeitarchivierung
- **Unicode**: PDF/A-3u unterstützt Unicode (empfohlen)
- **Embedded Files**: XML kann als Attachment eingebettet werden
- **XMP Metadaten**: Vollständige Metadaten erforderlich
- **AFRelationship**: `Alternative` für XML-Anhang

### Kritische Komponenten

1. **XMP Metadaten**
   - PDF/A-3 Conformance Level
   - Producer Information
   - Creation Date
   - Modification Date

2. **Embedded File Specification**
   - AFRelationship = "Alternative"
   - MIME Type = "application/xml"
   - Description = "ZUGFeRD Invoice XML (EN 16931)"

3. **Font Embedding**
   - Alle verwendeten Fonts müssen eingebettet sein
   - Unicode-Unterstützung für Sonderzeichen

## Lösungsansätze

### Option 1: Java + iText 7 (Empfohlen)

**Vorteile:**
- Vollständige PDF/A-3 Unterstützung
- Sehr gute Dokumentation
- Bewährt in Produktion

**Nachteile:**
- Java Runtime erforderlich
- Komplexere Deployment-Pipeline

**Beispiel-Implementierung:**

```java
// PDFA3Generator.java
package com.galifloor.invoice;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.pdfa.PdfADocument;
import com.itextpdf.pdfa.PdfAConformanceLevel;
import com.itextpdf.pdfa.PdfADocumentFactory;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.kernel.pdf.PdfName;
import com.itextpdf.kernel.pdf.PdfDictionary;
import com.itextpdf.kernel.pdf.PdfArray;
import com.itextpdf.kernel.pdf.PdfString;
import com.itextpdf.kernel.pdf.filespec.PdfFileSpec;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

public class PDFA3Generator {
    
    public static byte[] generatePDFA3(
        String pdfContent, // HTML oder strukturierte Daten
        String zugferdXML,
        InvoiceMetadata metadata
    ) throws Exception {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // PDF/A-3u Dokument erstellen
        PdfADocument pdfDoc = new PdfADocument(
            new PdfWriter(baos),
            PdfAConformanceLevel.PDF_A_3U,
            null // OutputIntent für Farbprofile
        );
        
        Document document = new Document(pdfDoc);
        
        // PDF-Inhalt hinzufügen (hier vereinfacht)
        document.add(new Paragraph("Rechnung " + metadata.invoiceNumber));
        // ... weitere Inhalte
        
        // XMP Metadaten setzen
        PdfDictionary xmpMetadata = new PdfDictionary();
        xmpMetadata.put(PdfName.Type, new PdfName("Metadata"));
        xmpMetadata.put(PdfName.Subtype, new PdfName("XML"));
        
        // XMP XML String (vereinfacht)
        String xmp = "<?xpacket begin=\"\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>" +
            "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">" +
            "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">" +
            "<rdf:Description rdf:about=\"\" xmlns:pdfaid=\"http://www.aiim.org/pdfa/ns/id/\">" +
            "<pdfaid:part>3</pdfaid:part>" +
            "<pdfaid:conformance>U</pdfaid:conformance>" +
            "</rdf:Description>" +
            "</rdf:RDF>" +
            "</x:xmpmeta>" +
            "<?xpacket end=\"w\"?>";
        
        pdfDoc.getCatalog().put(PdfName.Metadata, new PdfString(xmp));
        
        // ZUGFeRD XML als Embedded File
        byte[] xmlBytes = zugferdXML.getBytes(StandardCharsets.UTF_8);
        PdfFileSpec fileSpec = PdfFileSpec.createEmbeddedFileSpec(
            pdfDoc,
            xmlBytes,
            "ZUGFeRD-invoice.xml",
            "ZUGFeRD Invoice XML (EN 16931)",
            null, // MIME Type wird automatisch gesetzt
            PdfName.Data, // AFRelationship
            false // compression
        );
        
        // AFRelationship auf "Alternative" setzen
        PdfDictionary afRelationship = new PdfDictionary();
        afRelationship.put(PdfName.Type, PdfName.AFRelationship);
        afRelationship.put(PdfName.S, PdfName.Alternative);
        fileSpec.getPdfObject().put(PdfName.AFRelationship, PdfName.Alternative);
        
        // Embedded File zum Dokument hinzufügen
        PdfArray embeddedFiles = pdfDoc.getCatalog().getPdfObject()
            .getAsArray(PdfName.Names);
        if (embeddedFiles == null) {
            embeddedFiles = new PdfArray();
            pdfDoc.getCatalog().getPdfObject().put(PdfName.Names, embeddedFiles);
        }
        embeddedFiles.add(fileSpec.getPdfObject());
        
        document.close();
        
        return baos.toByteArray();
    }
}
```

### Option 2: Node.js + pdf-lib + pdfmake (Eingeschränkt)

**Vorteile:**
- Einfache Integration in bestehende Node.js/Laravel Umgebung
- Keine Java Runtime nötig

**Nachteile:**
- **pdf-lib unterstützt KEIN PDF/A-3** direkt
- XMP Metadaten müssen manuell hinzugefügt werden
- Nicht vollständig revisionssicher ohne zusätzliche Tools

**Workaround mit pdf-lib:**

```typescript
// generatePDFA3.ts (Node.js)
import { PDFDocument, PDFName, PDFDict, PDFString } from 'pdf-lib';
import { createHash } from 'crypto';

export async function generatePDFA3WithPDFLib(
    pdfBytes: ArrayBuffer,
    zugferdXML: string
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // XML als Attachment hinzufügen
    const xmlBytes = new TextEncoder().encode(zugferdXML);
    pdfDoc.attach(xmlBytes, 'ZUGFeRD-invoice.xml', {
        mimeType: 'application/xml',
        description: 'ZUGFeRD Invoice XML (EN 16931)',
        creationDate: new Date(),
        modificationDate: new Date(),
    });
    
    // WICHTIG: pdf-lib kann PDF/A-3 nicht vollständig erzeugen!
    // Für echte PDF/A-3 Konformität muss ein externes Tool verwendet werden:
    // - Apache PDFBox (Java)
    // - iText (Java)
    // - .NET PDF Library
    
    return await pdfDoc.save();
}
```

### Option 3: .NET + iTextSharp / PDFSharp

**Vorteile:**
- Gute Performance
- Vollständige PDF/A-3 Unterstützung

**Nachteile:**
- .NET Runtime erforderlich
- Weniger verbreitet in PHP/Laravel Umgebungen

## Empfohlene Lösung: Hybrid-Ansatz

### Frontend (Vue 3)
1. **Preview**: jsPDF für schnelle Vorschau
2. **InvoiceData**: Zentrale Datenquelle
3. **ZUGFeRD XML**: Generierung im Frontend

### Backend (Laravel)
1. **API Endpoint**: `/api/invoices/{id}/generate-erechnung`
2. **Java Service**: PDF/A-3 Generierung via Command oder REST API
3. **Response**: PDF/A-3 Byte-Stream

### Workflow

```
Frontend (Vue)
  ↓
InvoiceData generieren
  ↓
ZUGFeRD XML generieren
  ↓
API Request → Backend (Laravel)
  ↓
Laravel Controller
  ↓
Java Service (iText) → PDF/A-3 + XML Embedding
  ↓
Response → Frontend
  ↓
Download PDF/A-3
```

## Implementierung

### 1. Laravel Controller

```php
// app/Http/Controllers/InvoiceController.php

public function generateERechnung($id)
{
    $invoice = Invoice::with(['company', 'performances'])->findOrFail($id);
    $ownCompany = OwnCompany::first();
    
    // InvoiceData im Frontend generieren oder hier im Backend
    // Für Backend: InvoiceData als JSON von Frontend erhalten
    
    // Java Service aufrufen (via Command oder HTTP)
    $pdfBytes = $this->generatePDFA3ViaJava($invoice, $ownCompany);
    
    return response($pdfBytes)
        ->header('Content-Type', 'application/pdf')
        ->header('Content-Disposition', 
            'attachment; filename="RG-' . $invoice->year . '-' . $invoice->order_number . '-E-Rechnung.pdf"');
}

private function generatePDFA3ViaJava($invoice, $ownCompany)
{
    // Option 1: Java Command ausführen
    $invoiceDataJson = json_encode($this->buildInvoiceData($invoice, $ownCompany));
    $command = "java -jar pdfa3-generator.jar --input '" . escapeshellarg($invoiceDataJson) . "'";
    $pdfBytes = shell_exec($command);
    
    // Option 2: REST API zu Java Service
    // $response = Http::post('http://localhost:8080/generate-pdfa3', [
    //     'invoiceData' => $invoiceDataJson
    // ]);
    // $pdfBytes = $response->body();
    
    return $pdfBytes;
}
```

### 2. Java Service (iText 7)

```java
// PDFA3Service.java
@RestController
public class PDFA3Service {
    
    @PostMapping("/generate-pdfa3")
    public ResponseEntity<byte[]> generatePDFA3(@RequestBody InvoiceData invoiceData) {
        try {
            // ZUGFeRD XML generieren (aus InvoiceData)
            String zugferdXML = generateZUGFeRDXML(invoiceData);
            
            // PDF/A-3 generieren
            byte[] pdfBytes = PDFA3Generator.generatePDFA3(
                invoiceData,
                zugferdXML,
                new InvoiceMetadata(invoiceData)
            );
            
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
```

### 3. Frontend Integration

```typescript
// generateERechnung.ts (aktualisiert)

export async function generateERechnung(
    order: any, 
    ownCompany: any,
    usePDFA3: boolean = true // Flag für PDF/A-3 vs. Preview
): Promise<void> {
    // 1. InvoiceData generieren
    const invoiceData = buildInvoiceData(order, ownCompany);
    
    // 2. ZUGFeRD XML generieren
    const zugferdXML = generateZUGFeRDXML(invoiceData);
    
    if (usePDFA3) {
        // 3. Backend API aufrufen für PDF/A-3
        const response = await axios.post(
            `/api/invoices/${order.id}/generate-erechnung`,
            { invoiceData, zugferdXML },
            { responseType: 'blob' }
        );
        
        // 4. Download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `RG-${invoiceData.invoiceNumber}-E-Rechnung.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } else {
        // Preview mit jsPDF (nicht PDF/A-3)
        const pdfBytes = generateInvoicePDF(invoiceData);
        // ... Preview-Logik
    }
}
```

## XRechnung Support

XRechnung ist ein reines XML-Format ohne PDF. Für öffentliche Auftraggeber:

```typescript
// generateXRechnung.ts
export async function generateXRechnung(
    order: any,
    ownCompany: any
): Promise<void> {
    const invoiceData = buildInvoiceData(order, ownCompany);
    const xrechnungXML = generateXRechnungXML(invoiceData);
    
    // XML direkt herunterladen
    const blob = new Blob([xrechnungXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RG-${invoiceData.invoiceNumber}-XRechnung.xml`;
    link.click();
    URL.revokeObjectURL(url);
}
```

## Validierung

### PDF/A-3 Validierung

**Tools:**
- **veraPDF**: Open Source PDF/A Validator
- **Adobe Preflight**: Kommerziell
- **PDF/A Manager**: Online Validator

**Command Line:**
```bash
verapdf --format text input.pdf
```

### ZUGFeRD Validierung

- **ZUGFeRD Validator**: Online Tool von KoSIT
- **XRechnung Validator**: Online Tool für XRechnung

## Zusammenfassung

1. **Frontend**: jsPDF für Preview, InvoiceData als Single Source of Truth
2. **Backend**: Java/iText für PDF/A-3 Generierung
3. **XML**: ZUGFeRD für B2B, XRechnung für Behörden
4. **Workflow**: Frontend → Backend API → Java Service → PDF/A-3

## Nächste Schritte

1. Java Service mit iText 7 implementieren
2. Laravel API Endpoint erstellen
3. Frontend Integration aktualisieren
4. Validierungstests durchführen
5. XRechnung Support hinzufügen
