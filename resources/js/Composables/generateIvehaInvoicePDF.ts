import jsPDF from "jspdf";
import dayjs from "dayjs";
import "dayjs/locale/de";

dayjs.locale('de');

// Hilfsfunktion zum Laden eines Fonts als Base64
const loadFontAsBase64 = async (fontPath: string): Promise<string> => {
    try {
        const response = await fetch(fontPath);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Entferne den Data-URL-Präfix (data:font/ttf;base64,)
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Fehler beim Laden des Fonts ${fontPath}:`, error);
        throw error;
    }
};

// Fonts laden und registrieren
const loadAndRegisterFonts = async (doc: jsPDF) => {
    try {
        const baseUrl = window.location.origin;
        
        // Lade Palatino Linotype Roman (normal)
        const romanBase64 = await loadFontAsBase64(`${baseUrl}/fonts/palatinolinotype_roman.ttf`);
        doc.addFileToVFS('PalatinoLinotype-Roman.ttf', romanBase64);
        doc.addFont('PalatinoLinotype-Roman.ttf', 'PalatinoLinotype', 'normal');
        
        // Lade Palatino Linotype Bold (fett)
        const boldBase64 = await loadFontAsBase64(`${baseUrl}/fonts/palatinolinotype_bold.ttf`);
        doc.addFileToVFS('PalatinoLinotype-Bold.ttf', boldBase64);
        doc.addFont('PalatinoLinotype-Bold.ttf', 'PalatinoLinotype', 'bold');
        
        console.log('Fonts erfolgreich geladen und registriert');
    } catch (error) {
        console.error('Fehler beim Laden der Fonts:', error);
        // Fallback auf Standard-Fonts wenn Fonts nicht geladen werden können
    }
};

export const generateIvehaInvoicePDF = async (invoiceData: any) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Fonts laden und registrieren
    await loadAndRegisterFonts(doc);
    
    // Datum formatieren
    const invoiceDate = invoiceData.invoice_date ? dayjs(invoiceData.invoice_date) : dayjs();
    const formattedDate = invoiceDate.format("DD.MM.YYYY");
    
    // Bild-URL (aus public/images)
    const imageUrl = window.location.origin + '/images/Iveha_rechnungvorlage.png';
    
    // Warte auf das Bild und füge es als Hintergrund hinzu
    try {
        // Lade das Bild und füge es als Hintergrundbild hinzu
        // A4 Format: 210mm x 297mm
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            img.onload = () => {
                try {
                    // Füge das Bild als Hintergrund hinzu (volle Seite)
                    doc.addImage(img, 'PNG', 0, 0, 210, 297);
                    resolve(null);
                } catch (error) {
                    console.error('Fehler beim Hinzufügen des Bildes:', error);
                    reject(error);
                }
            };
            img.onerror = (error) => {
                console.error('Fehler beim Laden des Bildes:', error);
                reject(error);
            };
            img.src = imageUrl;
        });
    } catch (error) {
        console.error('Bild konnte nicht geladen werden, verwende Text-Version:', error);
    }
    
    // Textfarbe setzen (schwarz für bessere Lesbarkeit auf Hintergrund)
    doc.setTextColor(0, 0, 0);
    
    // Positionen basierend auf der Vorlage anpassen
    // Die Positionen müssen an die tatsächliche Vorlage angepasst werden
    
    // Datum (rechts oben, bei "Datum:")
    // BEISPIEL 1: Verwendung von Palatino Linotype Roman (normal)
    // doc.setFont("PalatinoLinotype", "normal");
    doc.setFontSize(10);
    //doc.setFont("helvetica", "normal");
    doc.setFont("PalatinoLinotype", "bold");
    doc.text(formattedDate, 162, 81.1, { align: "right" });
    
    // Projektnummer (bei "Projekt Nr.:")
    doc.setFontSize(11);
    doc.text(String(invoiceData.project_number || ""), 43, 120);
    
    // Bauvorhaben (bei "Bauvorhaben:")
    // Text in einer Zeile mit genug Breite
    doc.setFontSize(11);
    doc.setFont("PalatinoLinotype", "normal");
    
    const constructionAddress = String(invoiceData.construction_address || "");
    
    // Text direkt in einer Zeile ausgeben mit maximaler Breite
    // Von x=45 bis x=200 (155mm Breite) - genug Platz für lange Adressen
    // Falls immer noch zu kurz, wird automatisch umgebrochen
    const maxWidth = 160; // Maximale Breite in mm (fast die gesamte Seite)
    const addressLines = doc.splitTextToSize(constructionAddress, maxWidth);
    
    // Text in einer oder mehreren Zeilen ausgeben
    addressLines.forEach((line: string, index: number) => {
        doc.text(line, 45, 130.5 + (index * 4));
    });
    doc.setFont("PalatinoLinotype", "bold");
    // Rechnungsnummer (bei "Re. Nr.:")
    doc.text(String(invoiceData.invoice_number || ""), 157.5, 108.5);
    
    // Tabelle für Positionen - Positionen basierend auf Vorlage
    // Position 1 (bei "Pos." Spalte)
    const tableStartY = 100;
    const tableX = 15;
    
    // Tabelleninhalt - Positionen anpassen basierend auf Vorlage
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const contentY = tableStartY + 8;
    
    doc.setFont("PalatinoLinotype", "bold");
    // Bezeichnung (bei "Bezeichnung" Spalte)
    doc.text(String(invoiceData.description || ""), tableX + 18, contentY + 38);
    
    // Stunden (bei "Stunden" Spalte)
    doc.text(String(invoiceData.hours || "0"), tableX + 100, contentY + 38);
    
    doc.setFontSize(9);
    // Gesamtpreis (bei "Gesamtpreis" Spalte)
    doc.text((parseFloat(invoiceData.total_price || "0")).toFixed(2) + " €", tableX + 155, contentY + 38, { align: "center" });
    
    // Gesamtsumme, Skonto, Rechnungsbetrag (rechts, bei den entsprechenden Feldern)
    const summaryStartY = contentY + 15;
    const summaryTableX = 130;
    const summaryCol2X = 180; // Position für Beträge
    
    doc.setFontSize(9);
    
    // Gesamtsumme
    doc.text((parseFloat(invoiceData.total_sum || "0")).toFixed(2) + " €", tableX + 155, contentY + 46, { align: "center" });
    
    // -3% Skonto
    doc.text("-" + (parseFloat(invoiceData.skonto || "0")).toFixed(2) + " €", tableX + 155, contentY + 54, { align: "center" });
    
    // Rechnungsbetrag
    // BEISPIEL 2: Verwendung von Palatino Linotype Bold (fett)
    // doc.setFont("PalatinoLinotype", "bold");

    doc.text((parseFloat(invoiceData.invoice_amount || "0")).toFixed(2) + " €", tableX + 155, contentY + 62, { align: "center" });
    
    // Ausführungszeitraum (bei "Ausführungszeitraum: KW")
    // KW und Tag der Ausführung zusammen mit "->" dazwischen
    const infoStartY = summaryStartY + 25;
    doc.setFontSize(11);

    const executionPeriod = `${String(invoiceData.calendar_week || "")} -> ${String(invoiceData.execution_day || "")}`;
    doc.text(executionPeriod, 71, infoStartY + 39.2, { align: "left" });
    
    // PDF speichern
    const fileName = `Iveha-Rechnung-${invoiceData.invoice_number || 'unbekannt'}-${formattedDate.replace(/\./g, '-')}.pdf`;
    doc.save(fileName);
};

