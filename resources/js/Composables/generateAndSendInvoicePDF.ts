
import logo from "@/Assets/img.png";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import "dayjs/locale/de";
import axios from "axios";
dayjs.extend(weekOfYear);
dayjs.locale('de');

export const generateInvoiceAndSend = async (orderr: any) =>{
    const doc = new jsPDF();
    // Verwende das Ausstellungsdatum, falls vorhanden, sonst aktuelles Datum
    const invoiceDate = orderr?.issued_at ? dayjs(orderr.issued_at) : dayjs();
    const aktuellesDatum = invoiceDate.format("DD.MM.YYYY");
    const order = orderr
    doc.setTextColor(81,82,84);
    const logoUrl = logo; // Ersetze dies mit deinem Bildpfad
    doc.addImage(logoUrl, "PNG", 15, 15, 20, 15); // x, y, Breite, Höhe

    // Kopfzeile (Firmendaten)
    doc.setFontSize(8);
    doc.text("Geschäftsführer: Stefan Asenov", 40, 21);
    doc.setFontSize(7);
    doc.text("Gali Floor Industriebodentechnik", 40, 24);
    doc.text("Josefstraße 1, 59067 Hamm", 40, 27);
    doc.setFontSize(8);
    doc.text("Handelsregister Hamm", 171.5, 21, { align: "right" });
    doc.text("Steuer Nr. DE5454654", 175, 24, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(order?.company?.name, 15, 37);
    doc.setFont("helvetica", "normal")
    //doc.text(order.company?.name_description, 15, 40);
    doc.text("street", 15, 40);
    doc.text(order.company.address, 15, 43);
    doc.text(order.company.postal + " " + order.company.city, 15, 46);

    doc.setFillColor(220, 230, 255);
    doc.rect(15, 55, 100, 7, "F");
    doc.setFontSize(12);
    doc.text("Rechnung Nr. ", 17, 60);
    doc.setTextColor(0,0,155);
    doc.text(order.year + "-" + order.order_number, 45, 60);
    doc.setTextColor(81,82,84);
    doc.setFontSize(10);
    doc.text("Hamm, " + aktuellesDatum, 175, 60, { align: "right" });
    
    // Prüfe, ob Leistungen nach Ausstellung geändert wurden (vor Vorschau-Hinweis)
    // Prüfe sowohl auf true (boolean) als auch auf 1 (integer) und "1" (string)
    const hasModifiedAfterIssue = order.performances && order.performances.some((p: any) => {
        return p.modified_after_issue === true || p.modified_after_issue === 1 || p.modified_after_issue === "1";
    });
    const isCanceled = order.status === 'canceled';
    
    // Startposition für Bauvorhaben dynamisch anpassen
    let bauvorhabenStartY = 70;
    let noticeY = 67; // Y-Position für Hinweise
    
    // Storniert-Hinweis (höchste Priorität, wenn Rechnung storniert ist)
    if (isCanceled) {
        doc.setFontSize(12);
        doc.setTextColor(255, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("STORNIERT", 105, noticeY, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(81,82,84);
        bauvorhabenStartY = 75; // Mehr Platz für Storniert-Hinweis
        noticeY += 5; // Nächste Zeile für weitere Hinweise
    }
    
    // Korrigierte Rechnung Hinweis (nur wenn nicht storniert und geändert)
    if (hasModifiedAfterIssue && !isCanceled) {
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Korrigierte Rechnung", 17, noticeY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(81,82,84);
        if (bauvorhabenStartY === 70) {
            bauvorhabenStartY = 75; // Mehr Platz für Korrigiert-Hinweis
        }
    }

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold");
    doc.text("Bauvorhaben:", 15, bauvorhabenStartY);
    doc.text("Projekt Nr. ", 50, bauvorhabenStartY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0,0,155);
    doc.text(order.project_number, 65, bauvorhabenStartY);
    doc.setTextColor(81,82,84);
    doc.setFont("helvetica", "bold");
    doc.text("Anschrift:", 15, bauvorhabenStartY + 3);
    doc.setFont("helvetica", "normal");
    doc.text(order.construction, 15, bauvorhabenStartY + 5.5);
    doc.text(order.address, 15, bauvorhabenStartY + 8.5);
    doc.text(order.postal + " " + order.city, 15, bauvorhabenStartY + 11.5);
    doc.text(order.city, 15, bauvorhabenStartY + 14.5);

    // Tabelle - Startposition dynamisch anpassen
    const tableStartY = bauvorhabenStartY + 18; // Abstand nach Anschrift (mehr Platz für Stadt)
    doc.setFillColor(220, 230, 255); // Hellblauer Hintergrund
    doc.rect(15, tableStartY, 180, 5, "F");
    doc.setFontSize(8);
    doc.text("qm", 16, tableStartY + 3);
    doc.text("Bezeichnung", 30, tableStartY + 3);
    doc.text("Fixpreis | m²-Preis", 150, tableStartY + 3);
    doc.text("Preis", 190, tableStartY + 3, { align: "right" });

    doc.line(15, tableStartY + 5, 195, tableStartY + 5);

    let totalAmount = 0;
    let y = tableStartY + 10;

    for (let i = 0; i < order.performances.length; i++) {
        const performance = order.performances[i];

        // Validierung der Felder

        let lineHeight = 5; // Standardhöhe für jede Zeile
        const maxWidth = 120; // Maximale Breite für die Spalte "Bezeichnung"
        const wrappedText = doc.splitTextToSize(performance.performance, maxWidth); // Text umbrechen

        // Prüfen, ob Seitenumbruch notwendig ist
        if (y + wrappedText.length * lineHeight > doc.internal.pageSize.height - 10) {
            doc.addPage();
            y = 10; // Reset der Y-Position
        }

        // Menge (qm)
        doc.text(String(performance.qm), 16, y);

        // Leistung (Bezeichnung)
        doc.text(wrappedText, 30, y);

        // Preis pro qm / Fixpreis
        const performancePrice = Number(performance.price) || 0; // Falls price null, undefined oder String ist → 0 setzen
        if (performance.status === "canceled") {
            doc.setTextColor(255, 0, 0); // Rot
            const priceText = `${performancePrice.toFixed(2)} €`;
            doc.text(priceText, 150, y);
            const priceWidth = doc.getTextWidth(priceText);
            doc.line(150, y - 1, 150 + priceWidth, y - 1); // Durchstreichen
            doc.setTextColor(81,82,84);
        } else {
            doc.text(`${performancePrice.toFixed(2)} €`, 150, y);
            const qm = Number(performance.qm) || 0;
            const price = Number(performance.price) || 0;
            const total = performance.flatrate
                ? price
                : qm * price;
            totalAmount += total;
            const totalPrice = Number(total) || 0; // Falls price null, undefined oder String ist → 0 setzen

            doc.text(`${totalPrice.toFixed(2)} €`, 193, y, { align: "right" });
        }
        const textHeight = performance.performance.length > 1 ? wrappedText.length * lineHeight : lineHeight;
        y += textHeight;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Gesamtbetrag", 16, y + 5);
    doc.text(`${totalAmount.toFixed(2)} €`, 193, y + 5, { align: "right" });
    const totalWidth = doc.getTextWidth(`${totalAmount.toFixed(2)} €`);
    const totalY = y + 5;
    const lineStartX = 193 - totalWidth; // Startpunkt für die Linie
    const lineEndX = 193; // Endpunkt

    doc.line(lineStartX, totalY + 2, lineEndX, totalY + 2);
    doc.line(lineStartX, totalY + 3, lineEndX, totalY + 3);

    // Berechnungen
    const securityServicePercent = Number(order.company.security_service) || 0;
    const securityService = totalAmount / 100 * securityServicePercent;
    const cashDiscountPercent = Number(order.company.cash_discount) || 0;
    const cashDiscount = totalAmount / 100 * cashDiscountPercent;
    
    // Y-Position für Abzüge dynamisch anpassen
    let currentY = totalY + 10;
    
    // Sicherheitsleistung nur anzeigen, wenn > 0%
    if (securityServicePercent > 0) {
        doc.setFont("helvetica", "normal");
        doc.text("Sicherheitsleistung", 17, currentY);
        doc.text(securityServicePercent + " %", 150, currentY, { align: "right" });
        doc.text(`${securityService.toFixed(2)} €`, 193, currentY, { align: "right" });
        currentY += 4;
    }

    // Skonto anzeigen
    doc.setFont("helvetica", "normal");
    doc.text("Skonto", 17, currentY);
    doc.text(cashDiscountPercent + " %", 150, currentY, { align: "right" });
    doc.text(`${cashDiscount.toFixed(2)} €`, 193, currentY, { align: "right" });
    currentY += 4;

    doc.setFillColor(220, 230, 255); // Hellblauer Hintergrund
    doc.rect(15, currentY, 180, 5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Rechnungsbetrag (vor Abzug der Belastungen)
    doc.text("Rechnungsbetrag", 17, currentY + 4);
    const invoiceAmount = totalAmount - securityService - cashDiscount;
    doc.text(`${invoiceAmount.toFixed(2)} €`, 193, currentY + 4, { align: "right" });
    doc.setFontSize(8)
    const textWidth = doc.getTextWidth(`${invoiceAmount.toFixed(2)} €`);
    const lineStartX2 = 190 - textWidth;
    const lineEndX2 = 193;

    doc.line(lineStartX2, currentY + 4.5, lineEndX2, currentY + 4.5);
    doc.line(lineStartX2, currentY + 5, lineEndX2, currentY + 5);
    
    // Belastungsanzeigen anzeigen, falls vorhanden
    const charges = order.charges || [];
    const totalCharges = charges.reduce((sum: number, charge: any) => sum + parseFloat(charge.amount || 0), 0);
    
    if (totalCharges > 0) {
        currentY += 9; // Abstand nach Rechnungsbetrag
        
        // Belastungsanzeigen auflisten
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Belastungsanzeigen:", 17, currentY);
        currentY += 4;
        
        charges.forEach((charge: any) => {
            const chargeAmount = parseFloat(charge.amount || 0);
            const chargeDescription = charge.description || 'Belastung';
            doc.text(chargeDescription, 17, currentY);
            doc.text(`${chargeAmount.toFixed(2)} €`, 193, currentY, { align: "right" });
            currentY += 4;
        });
        
        // Gesamtbelastung
        doc.setFont("helvetica", "bold");
        doc.text("Gesamtbelastung", 17, currentY);
        doc.text(`${totalCharges.toFixed(2)} €`, 193, currentY, { align: "right" });
        currentY += 6;
        
        // Zwischenbetrag (Rechnungsbetrag - Belastungen)
        doc.setFillColor(220, 230, 255); // Hellblauer Hintergrund
        doc.rect(15, currentY, 180, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Zwischenbetrag", 17, currentY + 4);
        const intermediateAmount = invoiceAmount - totalCharges;
        doc.text(`${intermediateAmount.toFixed(2)} €`, 193, currentY + 4, { align: "right" });
        doc.setFontSize(8);
        const intermediateTextWidth = doc.getTextWidth(`${intermediateAmount.toFixed(2)} €`);
        const intermediateLineStartX = 190 - intermediateTextWidth;
        const intermediateLineEndX = 193;
        doc.line(intermediateLineStartX, currentY + 4.5, intermediateLineEndX, currentY + 4.5);
        doc.line(intermediateLineStartX, currentY + 5, intermediateLineEndX, currentY + 5);
    }

    // Funktion zum Generieren der einzelnen Werktage (ohne Wochenenden)
    const getWorkingDays = (startDate: any, endDate: any) => {
        if (!startDate || !endDate) return [];
        
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const days: string[] = [];
        
        let current = start.startOf('day');
        const endDay = end.startOf('day');
        
        // Prüfe ob current <= endDay
        while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
            // Wochentag: 0 = Sonntag, 6 = Samstag
            const dayOfWeek = current.day();
            // Nur Werktage (Montag bis Freitag)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const weekday = current.format("dddd");
                const kw = current.week();
                days.push(`${weekday}, ${current.format("DD.MM.YYYY")} (KW ${kw})`);
            }
            current = current.add(1, 'day');
        }
        
        return days;
    };

    // Ausführungdatum
    doc.setFont("helvetica", "normal");
    doc.text("Ausführungsdatum:", 15, currentY + 10);
    let executionY = currentY + 15;

    for (let i = 0; i < order.performances.length; i++) {
        const performance = order.performances[i];
        if (!performance || !performance.date) continue; // Validierung der Felder

        // Tages- und Wochenberechnung
        const date = dayjs(performance.date);
        const kw = date.week(); // KW des ursprünglichen Datums
        const weekday = date.format("dddd"); // Wochentag (z.B. Montag, Dienstag)
        let yOffset = 0;

        if (performance.status === "date_change" && performance.date_changed_to) {
            const newDate = dayjs(performance.date_changed_to);
            const newWeekday = newDate.format("dddd"); // Wochentag für geändertes Datum

            doc.setFont("helvetica", "normal");
            doc.text(`${newWeekday}, ${newDate.format("DD.MM.YYYY HH:mm")} (KW ${newDate.week()})`, 15, executionY);

            doc.setFontSize(8);
            doc.setTextColor(255, 0, 0);
            const oldDateText = `${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`;
            const oldDateX = 68;
            doc.text(oldDateText, oldDateX, executionY);
            const textWidth = doc.getTextWidth(oldDateText);
            doc.line(oldDateX, executionY - 1, oldDateX + textWidth, executionY - 1); // Linie durch Text
            doc.setTextColor(81,82,84);
            doc.setFontSize(8);

            yOffset = 5;
        } else if (performance.status === "canceled") {
            // Storniertes Datum komplett durchstreichen
            doc.setFontSize(8);
            doc.setTextColor(255, 0, 0);
            const canceledText = `${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`;
            doc.text(canceledText, 15, executionY);
            const textWidth = doc.getTextWidth(canceledText);
            doc.line(15, executionY - 1, 15 + textWidth, executionY - 1);
            doc.setTextColor(81,82,84);
            yOffset = 5;
        } else {
            doc.setFontSize(8);
            // Prüfe ob mehrere Tage vorhanden sind
            if (performance.end_date) {
                // Mehrere Tage: Alle Werktage auflisten
                const workingDays = getWorkingDays(performance.date, performance.end_date);
                if (workingDays.length > 0) {
                    workingDays.forEach((dayText) => {
                        doc.text(dayText, 15, executionY);
                        executionY += 5;
                    });
                    yOffset = 0; // Y-Offset wird bereits in der Schleife angepasst
                } else {
                    // Fallback: Wenn keine Werktage gefunden, normales Datum anzeigen
                    doc.text(`${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`, 15, executionY);
                    yOffset = 5;
                }
            } else {
                // Normales Datum ohne Änderung
                doc.text(`${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`, 15, executionY);
                yOffset = 5;
            }
        }

        executionY += yOffset; // Y-Position aktualisieren
    }

    doc.setFont("helvetica", "italic");
    doc.text("Die Umsatzsteuer wird gemäß § 13 b Abs. 2 Umsatzsteuergesetz vom Auftragsgeber abgeführt.", 15, executionY + 5);
    doc.setFont("helvetica", "normal")
    doc.text("Bitte überweisen Sie den angegebenen Rechnungsbetrag auf das angegebene Konto bei der Sparkasse Hamm", 15, executionY + 10);

    doc.setFontSize(6);
    const pageHeight = doc.internal.pageSize.height;

    const bottomMargin = 15;
    let startY = pageHeight - bottomMargin - 15; // 35 ist die Gesamthöhe des Textblocks

    doc.text("Gali Floor Industriebodentechnik", 15, startY);
    doc.text("Josefstraße 1", 15, startY + 3);
    doc.text("59067 Hamm", 15, startY + 6);

    doc.text("Telefon: 02381 / 27 95 644", 65, startY);
    doc.text("Handy: 0176 624 98101", 65, startY + 3);
    doc.text("Fax: 02381 / 79 57 41", 65, startY + 6);

    doc.text("Bankverbindung", 15, startY + 13);
    doc.text("Sparkasse Hamm", 15, startY + 16);
    doc.text("IBAN: DE 58 4105 0095 0011 0832 19", 45, startY + 16);
    doc.text("BIC: WELADED1HAM", 95, startY + 16);


    //doc.save("Rechnung-" + order.company.name + "-" + order.year + "-" + order.id + ".pdf");
    // PDF als Blob generieren
    const pdfBlob = doc.output("blob");

    const formData = new FormData();
    formData.append("pdf", pdfBlob, `invoice-${orderr.year}-${orderr.order_number}.pdf`);
    formData.append("order_number", orderr.order_number); // 🛠️ Korrekt als "order_id" senden

    try {
        await axios.post("/api/upload-invoice", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Rechnung erfolgreich gesendet!");
    } catch (error) {
        console.error("Fehler beim Hochladen:", error);
        alert("Fehler beim Senden der Rechnung.");
    }
};
