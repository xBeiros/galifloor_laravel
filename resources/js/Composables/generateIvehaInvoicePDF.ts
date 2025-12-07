import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import dayjs from "dayjs";
import "dayjs/locale/de";
import { generateIvehaReceiptPDF } from "./generateIvehaReceiptPDF";

dayjs.locale('de');

// Hilfsfunktion zum Laden eines PDFs
const loadPDFTemplate = async (pdfPath: string): Promise<Uint8Array> => {
    try {
        const response = await fetch(pdfPath);
        if (!response.ok) {
            throw new Error(`PDF konnte nicht geladen werden: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error(`Fehler beim Laden des PDFs ${pdfPath}:`, error);
        throw error;
    }
};

// Hilfsfunktion zum Laden eines Fonts
const loadFont = async (fontPath: string): Promise<Uint8Array> => {
    try {
        const response = await fetch(fontPath);
        if (!response.ok) {
            throw new Error(`Font konnte nicht geladen werden: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error(`Fehler beim Laden des Fonts ${fontPath}:`, error);
        throw error;
    }
};

export const generateIvehaInvoicePDF = async (invoiceData: any) => {
    // Datum formatieren
    const invoiceDate = invoiceData.invoice_date ? dayjs(invoiceData.invoice_date) : dayjs();
    const formattedDate = invoiceDate.format("DD.MM.YYYY");
    
    // PDF-Vorlage laden (aus public)
    const baseUrl = window.location.origin;
    const pdfUrl = `${baseUrl}/IVEHA_Vorlage.pdf`;
    
    let pdfBytes: Uint8Array;
    try {
        pdfBytes = await loadPDFTemplate(pdfUrl);
    } catch (error) {
        console.error('PDF-Vorlage konnte nicht geladen werden:', error);
        throw new Error('PDF-Vorlage konnte nicht geladen werden. Bitte stellen Sie sicher, dass die Datei IVEHA_Vorlage.pdf im Ordner public vorhanden ist.');
    }
    
    // PDF-Dokument laden
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Custom Fonts laden (Palatino Linotype aus public/fonts)
    let palatinoFont: PDFFont;
    let palatinoBoldFont: PDFFont;
    
    try {
        console.log('Starte Font-Ladevorgang...');
        const romanFontPath = `${baseUrl}/fonts/palatinolinotype_roman.ttf`;
        const boldFontPath = `${baseUrl}/fonts/palatinolinotype_bold.ttf`;
        
        console.log('Lade Roman Font von:', romanFontPath);
        const romanFontBytes = await loadFont(romanFontPath);
        console.log('Roman Font geladen, Größe:', romanFontBytes.length, 'bytes');
        
        console.log('Lade Bold Font von:', boldFontPath);
        const boldFontBytes = await loadFont(boldFontPath);
        console.log('Bold Font geladen, Größe:', boldFontBytes.length, 'bytes');
        
        // Fonts einbetten - pdf-lib unterstützt TTF-Fonts direkt
        console.log('Bette Roman Font ein...');
        palatinoFont = await pdfDoc.embedFont(romanFontBytes);
        console.log('Roman Font eingebettet:', palatinoFont ? 'Erfolg' : 'Fehler');
        
        console.log('Bette Bold Font ein...');
        palatinoBoldFont = await pdfDoc.embedFont(boldFontBytes);
        console.log('Bold Font eingebettet:', palatinoBoldFont ? 'Erfolg' : 'Fehler');
        
        // Verifiziere, dass die Fonts korrekt geladen wurden
        if (!palatinoFont || !palatinoBoldFont) {
            throw new Error('Fonts konnten nicht eingebettet werden');
                }
        
        // Test: Prüfe ob Fonts funktionieren
        const testWidth = palatinoFont.widthOfTextAtSize('Test', 12);
        const testBoldWidth = palatinoBoldFont.widthOfTextAtSize('Test', 12);
        console.log('Font-Test - Roman Font Textbreite:', testWidth);
        console.log('Font-Test - Bold Font Textbreite:', testBoldWidth);
        
        console.log('✅ Palatino Linotype Fonts erfolgreich geladen und eingebettet');
    } catch (error) {
        console.error('❌ Fehler beim Laden der Custom Fonts:', error);
        console.error('Fehlerdetails:', error instanceof Error ? error.message : String(error));
        console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
        
        // Fallback auf Standard-Fonts
        console.log('Verwende Standard-Fonts (Helvetica) als Fallback...');
        palatinoFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        palatinoBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        console.warn('⚠️ Verwende Standard-Fonts (Helvetica) als Fallback');
    }
    
    // Erste Seite des PDFs holen
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Konvertiere mm zu Points (1mm = 2.83465 points)
    const mmToPoints = (mm: number) => mm * 2.83465;
    
    // Textfarbe setzen (schwarz)
    const black = rgb(0, 0, 0);
    
    // Datum (rechts oben, bei "Datum:")
    // Position: x=162mm, y=81.1mm (von oben, daher height - y)
    // Rechtsbündig: x-Position minus Textbreite
    const dateTextWidth = palatinoBoldFont.widthOfTextAtSize(formattedDate, 10);
    firstPage.drawText(formattedDate, {
        x: mmToPoints(162) - dateTextWidth,
        y: height - mmToPoints(86.5),
        size: 10,
        font: palatinoBoldFont,
        color: black,
    });
    
    // Projektnummer (bei "Projekt Nr.:")
    firstPage.drawText(String(invoiceData.project_number || ""), {
        x: mmToPoints(43),
        y: height - mmToPoints(123.5),
        size: 11,
        font: palatinoFont,
        color: black,
    });
    
    // Bauvorhaben (bei "Bauvorhaben:")
    const constructionAddress = String(invoiceData.construction_address || "");
    // Text aufteilen falls zu lang (max. 160mm Breite)
    const maxWidthPoints = mmToPoints(160);
    const addressLines: string[] = [];
    let currentLine = '';
    const words = constructionAddress.split(' ');
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = palatinoFont.widthOfTextAtSize(testLine, 11);
        if (testWidth > maxWidthPoints && currentLine) {
            addressLines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        addressLines.push(currentLine);
    }
    
    // Text in einer oder mehreren Zeilen ausgeben
    addressLines.forEach((line: string, index: number) => {
        firstPage.drawText(line, {
            x: mmToPoints(45),
            y: height - mmToPoints(132 + (index * 4)),
            size: 11,
            font: palatinoFont,
            color: black,
        });
    });
    
    // Rechnungsnummer (bei "Re. Nr.:")
    const invoiceNumber = String('B',invoiceData.invoice_number || "");
    if (invoiceNumber) {
        firstPage.drawText(invoiceNumber, {
            x: mmToPoints(153.8),
            y: height - mmToPoints(106.8),
            size: 11,
            font: palatinoBoldFont,
            color: black,
        });
    }
    
    // Tabelle für Positionen
    const tableStartY = 100;
    const tableX = 15;
    const contentY = tableStartY + 8;
    
    // Berechne Stunden pro Person für die Bezeichnung
    const totalHours = parseFloat(invoiceData.hours || "0");
    const persons = parseFloat(invoiceData.persons || "1");
    const hoursPerPerson = persons > 0 ? totalHours / persons : totalHours;
    
    // Bezeichnung (bei "Bezeichnung" Spalte) - mit "X Personen à Y Stunden" erweitern
    const baseDescription = String(invoiceData.description || "");
    const hoursPerPersonFormatted = Math.round(hoursPerPerson).toString();
    const descriptionWithHours = `${baseDescription} à ${hoursPerPersonFormatted} Std.`;
    
    // Text aufteilen falls zu lang
    const maxDescWidthPoints = mmToPoints(120); // Maximale Breite für Bezeichnung
    const descLines: string[] = [];
    let currentDescLine = '';
    const descWords = descriptionWithHours.split(' ');
    
    for (const word of descWords) {
        const testLine = currentDescLine ? `${currentDescLine} ${word}` : word;
        const testWidth = palatinoBoldFont.widthOfTextAtSize(testLine, 11);
        if (testWidth > maxDescWidthPoints && currentDescLine) {
            descLines.push(currentDescLine);
            currentDescLine = word;
        } else {
            currentDescLine = testLine;
        }
    }
    if (currentDescLine) {
        descLines.push(currentDescLine);
    }
    
    // Bezeichnung in einer oder mehreren Zeilen ausgeben
    descLines.forEach((line: string, index: number) => {
        firstPage.drawText(line, {
            x: mmToPoints(tableX + 18),
            y: height - mmToPoints(contentY + 44.5 - (index * 4)),
            size: 10,
            font: palatinoFont,
            color: black,
        });
    });
    
    // Stunden (bei "Stunden" Spalte) - Gesamtanzahl der Stunden - zentriert
    const hoursText = Math.round(totalHours).toString();
    const hoursTextWidth = palatinoBoldFont.widthOfTextAtSize(hoursText, 11);
    firstPage.drawText(hoursText, {
        x: mmToPoints(tableX + 105.5) - (hoursTextWidth / 2),
        y: height - mmToPoints(contentY + 44.5),
        size: 10,
        font: palatinoFont,
        color: black,
    });
    
    // Pro Stunde (zwischen Stunden und Gesamtpreis) - zentriert
    const pricePerHourText = "45 €";
    const pricePerHourWidth = palatinoFont.widthOfTextAtSize(pricePerHourText, 11);
    firstPage.drawText(pricePerHourText, {
        x: mmToPoints(tableX + 130) - (pricePerHourWidth / 2),
        y: height - mmToPoints(contentY + 44.5),
        size: 10,
        font: palatinoFont,
        color: black,
    });
    
    // Gesamtpreis (bei "Gesamtpreis" Spalte) - zentriert
    const totalPriceText = (parseFloat(invoiceData.total_price || "0")).toFixed(2) + " €";
    const totalPriceWidth = palatinoFont.widthOfTextAtSize(totalPriceText, 9);
    firstPage.drawText(totalPriceText, {
        x: mmToPoints(tableX + 155) - (totalPriceWidth / 2),
        y: height - mmToPoints(contentY + 44.5),
        size: 9,
        font: palatinoFont,
        color: black,
    });
    
    // Gesamtsumme - zentriert
    const totalSumText = (parseFloat(invoiceData.total_sum || "0")).toFixed(2) + " €";
    const totalSumWidth = palatinoFont.widthOfTextAtSize(totalSumText, 9);
    firstPage.drawText(totalSumText, {
        x: mmToPoints(tableX + 155) - (totalSumWidth / 2),
        y: height - mmToPoints(contentY + 53.4),
        size: 9,
        font: palatinoFont,
        color: black,
    });
    
    // -3% Skonto - zentriert
    const skontoText = "-" + (parseFloat(invoiceData.skonto || "0")).toFixed(2) + " €";
    const skontoWidth = palatinoFont.widthOfTextAtSize(skontoText, 9);
    firstPage.drawText(skontoText, {
        x: mmToPoints(tableX + 155) - (skontoWidth / 2),
        y: height - mmToPoints(contentY + 58.7),
        size: 9,
        font: palatinoFont,
        color: black,
    });
    
    // Rechnungsbetrag - zentriert, bold und unterstrichen
    const invoiceAmountText = (parseFloat(invoiceData.invoice_amount || "0")).toFixed(2) + " €";
    const invoiceAmountWidth = palatinoBoldFont.widthOfTextAtSize(invoiceAmountText, 9);
    const invoiceAmountX = mmToPoints(tableX + 155) - (invoiceAmountWidth / 2);
    const invoiceAmountY = height - mmToPoints(contentY + 64.4);
    
    // Text zeichnen (bold)
    firstPage.drawText(invoiceAmountText, {
        x: invoiceAmountX,
        y: invoiceAmountY,
        size: 9,
        font: palatinoBoldFont,
        color: black,
    });
    
    // Unterstreichung zeichnen
    const underlineY = invoiceAmountY - 2; // 2 Points unter dem Text
    const underlineStartX = invoiceAmountX;
    const underlineEndX = invoiceAmountX + invoiceAmountWidth;
    firstPage.drawLine({
        start: { x: underlineStartX, y: underlineY },
        end: { x: underlineEndX, y: underlineY },
        thickness: 0.5,
        color: black,
    });
    
    // Ausführungszeitraum (bei "Ausführungszeitraum: KW")
    const infoStartY = contentY + 15 + 25;
    const executionPeriod = `KW ${String(invoiceData.calendar_week || "")} -> ${String(invoiceData.execution_day || "")}`;
    firstPage.drawText(executionPeriod, {
        x: mmToPoints(62),
        y: height - mmToPoints(infoStartY + 36),
        size: 11,
        font: palatinoBoldFont,
        color: black,
    });
    
    // PDF speichern und herunterladen
    const modifiedPdfBytes = await pdfDoc.save();
    const blob = new Blob([modifiedPdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Iveha-Rechnung-${invoiceData.invoice_number || 'unbekannt'}-${formattedDate.replace(/\./g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Kurze Verzögerung vor dem Download der Quittung, damit der Browser beide Downloads nicht blockiert
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Quittung ebenfalls erstellen und herunterladen
    try {
        await generateIvehaReceiptPDF(invoiceData);
    } catch (error) {
        console.error('Fehler beim Erstellen der Quittung:', error);
    }
};

