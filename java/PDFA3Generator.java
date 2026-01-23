/**
 * PDF/A-3 Generator mit iText 7
 * 
 * Diese Java-Klasse generiert PDF/A-3-konforme E-Rechnungen mit eingebettetem ZUGFeRD XML.
 * 
 * Verwendung:
 * 1. Als JAR-Datei kompilieren: mvn clean package
 * 2. Aufruf: java -jar pdfa3-generator.jar --invoiceData '...' --zugferdXML '...'
 * 3. Oder als REST Service: Spring Boot Application
 * 
 * Abhängigkeiten (Maven pom.xml):
 * - com.itextpdf:itext7-core:7.2.5
 * - com.itextpdf:itext7-pdfa:7.2.5
 * - com.itextpdf:html2pdf:4.0.5 (optional, für HTML zu PDF)
 */

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
import com.itextpdf.io.source.ByteArrayOutputStream;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class PDFA3Generator {
    
    /**
     * Generiert ein PDF/A-3u Dokument mit eingebettetem ZUGFeRD XML.
     * 
     * @param invoiceData InvoiceData als Map (von JSON)
     * @param zugferdXML ZUGFeRD XML String
     * @return PDF/A-3 Byte-Array
     */
    public static byte[] generatePDFA3(
        Map<String, Object> invoiceData,
        String zugferdXML
    ) throws Exception {
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // PDF/A-3u Dokument erstellen (Unicode-Unterstützung)
        PdfADocument pdfDoc = new PdfADocument(
            new PdfWriter(baos),
            PdfAConformanceLevel.PDF_A_3U,
            null // OutputIntent für Farbprofile (optional)
        );
        
        Document document = new Document(pdfDoc);
        
        // ============================================================
        // PDF-Inhalt generieren
        // ============================================================
        // Hier würde die eigentliche PDF-Generierung stattfinden
        // basierend auf invoiceData. Für dieses Beispiel vereinfacht:
        
        String invoiceNumber = (String) invoiceData.get("invoiceNumber");
        String invoiceDate = (String) invoiceData.get("invoiceDate");
        
        document.add(new Paragraph("Rechnung " + invoiceNumber));
        document.add(new Paragraph("Datum: " + invoiceDate));
        
        // Weitere Inhalte aus invoiceData:
        // - Seller/Buyer Informationen
        // - Line Items
        // - Totals
        // - etc.
        
        // ============================================================
        // XMP Metadaten setzen
        // ============================================================
        String xmpMetadata = generateXMPMetadata(invoiceData);
        pdfDoc.getCatalog().put(PdfName.Metadata, new PdfString(xmpMetadata));
        
        // ============================================================
        // ZUGFeRD XML als Embedded File hinzufügen
        // ============================================================
        byte[] xmlBytes = zugferdXML.getBytes(StandardCharsets.UTF_8);
        
        // Embedded File Specification erstellen
        PdfFileSpec fileSpec = PdfFileSpec.createEmbeddedFileSpec(
            pdfDoc,
            xmlBytes,
            "ZUGFeRD-invoice.xml",
            "ZUGFeRD Invoice XML (EN 16931)",
            null, // MIME Type wird automatisch gesetzt
            PdfName.Data, // AFRelationship
            false // compression
        );
        
        // AFRelationship auf "Alternative" setzen (wichtig für PDF/A-3)
        PdfDictionary afRelationship = new PdfDictionary();
        afRelationship.put(PdfName.Type, PdfName.AFRelationship);
        afRelationship.put(PdfName.S, PdfName.Alternative);
        fileSpec.getPdfObject().put(PdfName.AFRelationship, PdfName.Alternative);
        
        // Embedded File zum Dokument hinzufügen
        PdfDictionary namesDict = pdfDoc.getCatalog().getPdfObject().getAsDictionary(PdfName.Names);
        if (namesDict == null) {
            namesDict = new PdfDictionary();
            pdfDoc.getCatalog().getPdfObject().put(PdfName.Names, namesDict);
        }
        
        PdfArray embeddedFiles = namesDict.getAsArray(PdfName.EmbeddedFiles);
        if (embeddedFiles == null) {
            embeddedFiles = new PdfArray();
            namesDict.put(PdfName.EmbeddedFiles, embeddedFiles);
        }
        embeddedFiles.add(fileSpec.getPdfObject());
        
        document.close();
        
        return baos.toByteArray();
    }
    
    /**
     * Generiert XMP Metadaten für PDF/A-3.
     */
    private static String generateXMPMetadata(Map<String, Object> invoiceData) {
        String invoiceNumber = (String) invoiceData.get("invoiceNumber");
        String invoiceDate = (String) invoiceData.get("invoiceDate");
        
        return "<?xpacket begin=\"\" id=\"W5M0MpCehiHzreSzNTczkc9d\"?>" +
            "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\">" +
            "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">" +
            // PDF/A-3 Conformance
            "<rdf:Description rdf:about=\"\" xmlns:pdfaid=\"http://www.aiim.org/pdfa/ns/id/\">" +
            "<pdfaid:part>3</pdfaid:part>" +
            "<pdfaid:conformance>U</pdfaid:conformance>" +
            "</rdf:Description>" +
            // Dublin Core
            "<rdf:Description rdf:about=\"\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\">" +
            "<dc:title>Rechnung " + escapeXML(invoiceNumber) + "</dc:title>" +
            "<dc:creator>Gali Floor Industriebodentechnik</dc:creator>" +
            "<dc:date>" + invoiceDate + "</dc:date>" +
            "</rdf:Description>" +
            // PDF Properties
            "<rdf:Description rdf:about=\"\" xmlns:pdf=\"http://ns.adobe.com/pdf/1.3/\">" +
            "<pdf:Producer>iText 7 PDF/A-3 Generator</pdf:Producer>" +
            "</rdf:Description>" +
            "</rdf:RDF>" +
            "</x:xmpmeta>" +
            "<?xpacket end=\"w\"?>";
    }
    
    private static String escapeXML(String str) {
        if (str == null) return "";
        return str
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }
    
    /**
     * Main-Methode für Command-Line Aufruf.
     */
    public static void main(String[] args) {
        // Command-Line Parser (vereinfacht)
        // In Produktion: Apache Commons CLI oder ähnlich verwenden
        
        if (args.length < 4) {
            System.err.println("Usage: java -jar pdfa3-generator.jar --invoiceData 'JSON' --zugferdXML 'XML'");
            System.exit(1);
        }
        
        String invoiceDataJson = null;
        String zugferdXML = null;
        
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("--invoiceData") && i + 1 < args.length) {
                invoiceDataJson = args[i + 1];
            } else if (args[i].equals("--zugferdXML") && i + 1 < args.length) {
                zugferdXML = args[i + 1];
            }
        }
        
        if (invoiceDataJson == null || zugferdXML == null) {
            System.err.println("Fehler: invoiceData und zugferdXML erforderlich");
            System.exit(1);
        }
        
        try {
            // JSON zu Map parsen (vereinfacht, in Produktion: Jackson/Gson)
            // Map<String, Object> invoiceData = parseJSON(invoiceDataJson);
            
            // PDF/A-3 generieren
            // byte[] pdfBytes = generatePDFA3(invoiceData, zugferdXML);
            
            // PDF nach stdout schreiben
            // System.out.write(pdfBytes);
            
            System.err.println("Hinweis: Vollständige Implementierung erfordert JSON-Parsing");
        } catch (Exception e) {
            System.err.println("Fehler: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
