
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
    doc.text("Steuer Nr. 322 5007 4942", 175, 24, { align: "right" });

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

    // Tabelle - Startposition dynamisch anpassen
    const tableStartY = bauvorhabenStartY + 15; // Abstand nach Anschrift
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

    // Sicherheitsleistung anzeigen
    doc.setFont("helvetica", "normal");
    doc.text("Sicherheitsleistung", 17, totalY + 10); // Text für Sicherheitsleistung
    const securityServicePercent = Number(order.company.security_service) || 0;
    doc.text(securityServicePercent + " %", 150, totalY + 10, { align: "right" }); // Prozentwert
    const securityService = totalAmount / 100 * securityServicePercent;
    doc.text(`${securityService.toFixed(2)} €`, 193, totalY + 10, { align: "right" });

    doc.text("Skonto", 17, totalY + 14); // Text für Sicherheitsleistung
    const cashDiscountPercent = Number(order.company.cash_discount) || 0;
    doc.text(cashDiscountPercent + " %", 150, totalY + 14, { align: "right" }); // Prozentwert
    const cashDiscount = totalAmount / 100 * cashDiscountPercent;
    doc.text(`${cashDiscount.toFixed(2)} €`, 193, totalY + 14, { align: "right" });

    doc.setFillColor(220, 230, 255); // Hellblauer Hintergrund
    doc.rect(15, totalY + 15, 180, 5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Rechnungsbetrag
    doc.text("Rechnungsbetrag", 17, totalY + 19);
    const invoiceAmount = totalAmount - securityService - cashDiscount;
    doc.text(`${invoiceAmount.toFixed(2)} €`, 193, totalY + 19, { align: "right" });
    doc.setFontSize(8)
    const textWidth = doc.getTextWidth(`${invoiceAmount.toFixed(2)} €`);
    const lineStartX2 = 190 - textWidth;
    const lineEndX2 = 193;

    doc.line(lineStartX2, totalY + 19.5, lineEndX2, totalY + 19.5);
    doc.line(lineStartX2, totalY + 20, lineEndX2, totalY + 20);

    // Ausführungdatum
    doc.setFont("helvetica", "normal");
    doc.text("Ausführungsdatum:", 15, totalY + 25);
    let currentY = totalY + 30;

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
            doc.text(`${newWeekday}, ${newDate.format("DD.MM.YYYY HH:mm")} (KW ${newDate.week()})`, 15, currentY);

            doc.setFontSize(8);
            doc.setTextColor(255, 0, 0);
            const oldDateText = `${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`;
            const oldDateX = 68;
            doc.text(oldDateText, oldDateX, currentY);
            const textWidth = doc.getTextWidth(oldDateText);
            doc.line(oldDateX, currentY - 1, oldDateX + textWidth, currentY - 1); // Linie durch Text
            doc.setTextColor(81,82,84);
            doc.setFontSize(8);

            yOffset = 5;
        } else if (performance.status === "canceled") {
            // Storniertes Datum komplett durchstreichen
            doc.setFontSize(8);
            doc.setTextColor(255, 0, 0);
            const canceledText = `${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`;
            doc.text(canceledText, 15, currentY);
            const textWidth = doc.getTextWidth(canceledText);
            doc.line(15, currentY - 1, 15 + textWidth, currentY - 1);
            doc.setTextColor(81,82,84);
            yOffset = 5;
        } else {
            doc.setFontSize(8)
            // Normales Datum ohne Änderung
            doc.text(`${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`, 15, currentY);
            yOffset = 5;
        }

        currentY += yOffset; // Y-Position aktualisieren
    }

    doc.setFont("helvetica", "italic");
    doc.text("Die Umsatzsteuer wird gemäß § 13 b Abs. 2 Umsatzsteuergesetz vom Auftragsgeber abgeführt.", 15, currentY + 5);
    doc.setFont("helvetica", "normal")
    doc.text("Bitte überweisen Sie den angegebenen Rechnungsbetrag auf das angegebene Konto bei der Sparkasse Hamm", 15, currentY + 10);

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
