import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import dayjs from "dayjs";
import "dayjs/locale/de";

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

// Hilfsfunktion: Zahl in Worten (Deutsch)
const numberToWords = (num: number): string => {
    const ones = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
    const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
    
    if (num === 0) return 'null';
    if (num < 20) return ones[num];
    
    if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        if (one === 0) return tens[ten];
        return ones[one] + 'und' + tens[ten];
    }
    
    if (num < 1000) {
        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        let result = hundred === 1 ? 'einhundert' : ones[hundred] + 'hundert';
        if (remainder > 0) {
            if (remainder < 20) {
                result += ones[remainder];
            } else {
                result += ones[remainder % 10] + 'und' + tens[Math.floor(remainder / 10)];
            }
        }
        return result;
    }
    
    if (num < 1000000) {
        const thousand = Math.floor(num / 1000);
        const remainder = num % 1000;
        let result = thousand === 1 ? 'eintausend' : numberToWords(thousand) + 'tausend';
        if (remainder > 0) result += numberToWords(remainder);
        return result;
    }
    
    return num.toString();
};

// Konvertiert Euro-Betrag in Worte (ohne Cent, ohne "Euro")
const euroToWords = (amount: number): string => {
    const euros = Math.floor(amount);
    
    let result = '';
    if (euros > 0) {
        result = numberToWords(euros);
    }
    if (!result) result = 'null';
    
    // Erste Buchstabe großschreiben
    return result.charAt(0).toUpperCase() + result.slice(1);
};

// Hilfsfunktion: Erstellt eine einzelne Quittung mit einem bestimmten Betrag
const createSingleReceipt = async (
    invoiceData: any,
    amount: number,
    receiptNumber: number,
    totalReceipts: number,
    baseUrl: string
): Promise<Uint8Array> => {
    // PDF-Vorlage laden
    const pdfUrl = `${baseUrl}/Quitungvorlage.pdf`;
    const pdfBytes = await loadPDFTemplate(pdfUrl);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Custom Fonts laden (in jedem PDF neu einbetten)
    let palatinoFont: PDFFont;
    let palatinoBoldFont: PDFFont;
    let helveticaFont: PDFFont;
    
    try {
        const romanFontBytes = await loadFont(`${baseUrl}/fonts/palatinolinotype_roman.ttf`);
        const boldFontBytes = await loadFont(`${baseUrl}/fonts/palatinolinotype_bold.ttf`);
        
        palatinoFont = await pdfDoc.embedFont(romanFontBytes);
        palatinoBoldFont = await pdfDoc.embedFont(boldFontBytes);
        helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    } catch (error) {
        console.error('Fehler beim Laden der Custom Fonts, verwende Standard-Fonts:', error);
        palatinoFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        palatinoBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    // Erste Seite des PDFs holen
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Konvertiere mm zu Points (1mm = 2.83465 points)
    const mmToPoints = (mm: number) => mm * 2.83465;
    
    // Textfarbe setzen
    const darkBlue = rgb(0.1, 0.2, 0.4);
    const black = rgb(0, 0, 0);
    
    const nettoAmount = amount;
    
    // Positionen basierend auf der Vorlage anpassen
    // Diese Positionen müssen an die tatsächliche Vorlage angepasst werden
    
    // Netto EUR (rechts oben, erste Box)
    const nettoText = nettoAmount.toFixed(2);
    const nettoWidth = helveticaFont.widthOfTextAtSize(nettoText, 11);
    firstPage.drawText(nettoText, {
        x: mmToPoints(139) - (nettoWidth / 2),
        y: height - mmToPoints(32.3),
        size: 11,
        font: palatinoBoldFont,
        color: darkBlue,
    });
    
    // Gesamt EUR (rechts oben, dritte Box) - Netto-Betrag
    const gesamtText = nettoAmount.toFixed(2);
    const gesamtWidth = helveticaFont.widthOfTextAtSize(gesamtText, 11);
    firstPage.drawText(gesamtText, {
        x: mmToPoints(139) - (gesamtWidth / 2),
        y: height - mmToPoints(51),
        size: 11,
        font: palatinoBoldFont,
        color: darkBlue,
    });
    
    
    // EUR in Worten (links, unter EUR)
    const wordsText = euroToWords(nettoAmount);
    const wordsLines: string[] = [];
    const maxWidth = mmToPoints(100);
    let currentLine = '';
    const words = wordsText.split(' ');
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = palatinoFont.widthOfTextAtSize(testLine, 11);
        if (testWidth > maxWidth && currentLine) {
            wordsLines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) wordsLines.push(currentLine);
    
    wordsLines.forEach((line, index) => {
        firstPage.drawText(line, {
            x: mmToPoints(45),
            y: height - mmToPoints(59.5 - (index * 5)),
            size: 11,
            font: palatinoFont,
            color: black,
        });
    });
    
    // von (links)
    firstPage.drawText('Gali Floor - Stefan Asenov', {
        x: mmToPoints(45),
        y: height - mmToPoints(67.5),
        size: 11,
        font: palatinoFont,
        color: black,
    });
    
    // für (links)
    const invoiceYear = invoiceData.invoice_date ? invoiceData.invoice_date.split('-')[0] : '2024';
    let forText = `Iveha Floor GmbH - RG${invoiceYear-1}-B${invoiceData.invoice_number || ''}`;
    // Bei mehreren Quittungen: Nummer/Gesamtanzahl hinzufügen
    if (totalReceipts > 1) {
        forText += ` ${receiptNumber}/${totalReceipts}`;
    }
    firstPage.drawText(forText, {
        x: mmToPoints(45),
        y: height - mmToPoints(75.5),
        size: 11,
        font: palatinoFont,
        color: black,
    });
    
    // Ort/Datum (links) - Ort: Hamm, Datum: leer
    firstPage.drawText('Hamm', {
        x: mmToPoints(35),
        y: height - mmToPoints(94),
        size: 11,
        font: palatinoFont,
        color: black,
    });
    
    // Buchungsvermerke (links) - leer lassen
    
    // Rechts: "dankend erhalten."
    // (bereits in der Vorlage vorhanden)
    
    // Datum (rechts, fett) - leer lassen wie gewünscht
    // (nicht ausfüllen)
    
    // "Stempel/Unterschrift des Empfängers" (rechts unten)
    // (bereits in der Vorlage vorhanden)
    
    // PDF speichern und zurückgeben
    return await pdfDoc.save();
};

export const generateIvehaReceiptPDF = async (invoiceData: any) => {
    const baseUrl = window.location.origin;
    
    // Rechnungsbetrag (Netto = Gesamtbetrag abzgl. Skonto)
    const invoiceAmount = parseFloat(invoiceData.invoice_amount || "0");
    
    // Prüfe ob Betrag über 5000 Euro
    const MAX_RECEIPT_AMOUNT = 5000;
    
    if (invoiceAmount <= MAX_RECEIPT_AMOUNT) {
        // Normale Quittung (unter 5000 Euro)
        const receiptBytes = await createSingleReceipt(
            invoiceData,
            invoiceAmount,
            1,
            1,
            baseUrl
        );
        
        const blob = new Blob([receiptBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const receiptDate = invoiceData.invoice_date ? dayjs(invoiceData.invoice_date).format("DD.MM.YYYY") : '';
        link.download = `Iveha-Quittung-${invoiceData.invoice_number || 'unbekannt'}-${receiptDate.replace(/\./g, '-')}.pdf`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        // Mehrere Quittungen erstellen
        let remainingAmount = invoiceAmount;
        let receiptNumber = 1;
        const receiptAmounts: number[] = [];
        
        // Berechne Anzahl der Quittungen
        while (remainingAmount > 0) {
            const amount = Math.min(remainingAmount, MAX_RECEIPT_AMOUNT);
            receiptAmounts.push(amount);
            remainingAmount -= amount;
        }
        
        const totalReceipts = receiptAmounts.length;
        
        // Erstelle und lade jede Quittung
        for (const amount of receiptAmounts) {
            const receiptBytes = await createSingleReceipt(
                invoiceData,
                amount,
                receiptNumber,
                totalReceipts,
                baseUrl
            );
            
            const blob = new Blob([receiptBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const receiptDate = invoiceData.invoice_date ? dayjs(invoiceData.invoice_date).format("DD.MM.YYYY") : '';
            const suffix = totalReceipts > 1 ? `-Teil${receiptNumber}` : '';
            link.download = `Iveha-Quittung-${invoiceData.invoice_number || 'unbekannt'}${suffix}-${receiptDate.replace(/\./g, '-')}.pdf`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Kurze Verzögerung zwischen Downloads
            await new Promise(resolve => setTimeout(resolve, 100));
            
            receiptNumber++;
        }
    }
};
