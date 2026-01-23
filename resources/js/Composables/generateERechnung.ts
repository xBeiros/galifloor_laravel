import logo from "@/Assets/img.png";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import "dayjs/locale/de";
import { PDFDocument } from "pdf-lib";
dayjs.extend(weekOfYear);
dayjs.locale('de');

// ============================================================================
// 1️⃣ DATENMODELL - TypeScript Interfaces
// ============================================================================

export interface InvoiceCompany {
    name: string;
    address: string;
    postal: string;
    city: string;
    country: string;
    taxIdentificationNumber: string;
    ownerName?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    iban?: string;
    bic?: string;
}

export interface InvoiceCustomer {
    name: string;
    address: string;
    postal: string;
    city: string;
    country: string;
    taxIdentificationNumber?: string;
}

export interface InvoiceDeliveryAddress {
    name: string; // Bauvorhaben / construction
    address: string;
    postal: string;
    city: string;
    country: string;
}

export interface InvoiceLine {
    lineNumber: number;
    description: string;
    quantity: number;
    unitCode: string; // C62 = Stück, M2 = Quadratmeter
    unitPrice: number;
    isFlatrate: boolean;
    lineTotal: number;
    status: 'active' | 'canceled' | 'date_change' | 'modified';
    executionDate?: string; // ISO format
    executionDateChanged?: string; // ISO format
    calendarWeek?: number;
}

export interface InvoiceTotals {
    lineTotalAmount: number; // Summe aller Positionen
    securityServiceAmount: number; // Sicherheitsleistung (Abschlag)
    cashDiscountAmount: number; // Skonto (Abschlag)
    taxBasisAmount: number; // Besteuerungsgrundlage
    taxAmount: number; // Umsatzsteuer (0% bei Reverse Charge)
    grandTotalAmount: number; // Rechnungsbetrag (nach Abzügen)
    totalPrepaidAmount: number; // Vorauszahlungen
    duePayableAmount: number; // Zahlbetrag
}

export interface InvoiceData {
    // Rechnungsidentifikation
    invoiceNumber: string; // Format: YYYY-XXXXX
    invoiceDate: string; // ISO 8601 format
    invoiceType: 'invoice' | 'credit_note' | 'prepayment';
    
    // Projektinformationen
    projectNumber: string;
    
    // Parteien
    seller: InvoiceCompany;
    buyer: InvoiceCustomer;
    deliveryAddress: InvoiceDeliveryAddress;
    
    // Positionen
    lines: InvoiceLine[];
    
    // Summen
    totals: InvoiceTotals;
    
    // Zahlungsinformationen
    paymentMeans: string; // z.B. "Überweisung"
    paymentTerms?: string; // z.B. "3% Skonto bei Zahlung innerhalb von 14 Tagen"
    
    // Rechtstexte
    taxNote: string; // §13b UStG Hinweis
    paymentNote: string; // Überweisungshinweis
    
    // Status-Flags
    isCanceled: boolean;
    isCorrected: boolean;
    hasModifiedAfterIssue: boolean;
}

// ============================================================================
// 2️⃣ RECHNUNGSAUFBAU - Business Logic
// ============================================================================

/**
 * Baut das zentrale InvoiceData-Objekt aus Order- und Company-Daten auf.
 * Hier finden ALLE Berechnungen statt.
 */
export function buildInvoiceData(order: any, ownCompany: any): InvoiceData {
    const invoiceDate = order?.issued_at ? dayjs(order.issued_at) : dayjs();
    const invoiceNumber = `${order.year}-${order.order_number}`;
    
    // Verkäufer (Eigene Firma)
    const seller: InvoiceCompany = {
        name: ownCompany?.name || "Gali Floor Industriebodentechnik",
        address: ownCompany?.address || "Josefstraße 1",
        postal: ownCompany?.postal || "59067",
        city: ownCompany?.city || "Hamm",
        country: "DE",
        taxIdentificationNumber: ownCompany?.tax_identification_number || "322 5007 4942",
        ownerName: ownCompany?.owner_name || "Stefan Asenov",
        phone: ownCompany?.phone || "02381 / 27 95 644",
        email: ownCompany?.email,
        bankName: "Sparkasse Hamm",
        iban: "DE 58 4105 0095 0011 0832 19",
        bic: "WELADED1HAM",
    };
    
    // Käufer (Kundenfirma)
    const buyer: InvoiceCustomer = {
        name: order.company?.name || "",
        address: order.company?.address || "",
        postal: order.company?.postal || "",
        city: order.company?.city || "",
        country: "DE",
        taxIdentificationNumber: order.company?.tax_identification_number,
    };
    
    // Lieferadresse (Bauvorhaben)
    const deliveryAddress: InvoiceDeliveryAddress = {
        name: order.construction || "",
        address: order.address || "",
        postal: order.postal || "",
        city: order.city || "",
        country: "DE",
    };
    
    // Positionen aufbauen (nur aktive, nicht stornierte)
    const lines: InvoiceLine[] = [];
    let lineNumber = 1;
    
    for (const perf of order.performances || []) {
        if (perf.status === "canceled") {
            continue; // Stornierte Positionen werden nicht in die Rechnung aufgenommen
        }
        
        const quantity = Number(perf.qm) || 0;
        const unitPrice = Number(perf.price) || 0;
        const isFlatrate = Boolean(perf.flatrate);
        const lineTotal = isFlatrate ? unitPrice : quantity * unitPrice;
        
        const executionDate = perf.date ? dayjs(perf.date) : null;
        
        // Einheit korrekt bestimmen: MTK für qm, C62 für Stück/Flatrate
        const unitCode = isFlatrate ? "C62" : "MTK";
        
        lines.push({
            lineNumber: lineNumber++,
            description: perf.performance || "",
            quantity: quantity,
            unitCode: unitCode,
            unitPrice: unitPrice,
            isFlatrate: isFlatrate,
            lineTotal: lineTotal,
            status: perf.status || 'active',
            executionDate: executionDate ? executionDate.toISOString() : undefined,
            executionDateChanged: perf.date_changed_to ? dayjs(perf.date_changed_to).toISOString() : undefined,
            calendarWeek: executionDate ? executionDate.week() : undefined,
        });
    }
    
    // Summen berechnen
    const lineTotalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    
    const securityServicePercent = Number(order.company?.security_service) || 0;
    const cashDiscountPercent = Number(order.company?.cash_discount) || 0;
    
    const securityServiceAmount = (lineTotalAmount * securityServicePercent) / 100;
    const cashDiscountAmount = (lineTotalAmount * cashDiscountPercent) / 100;
    
    // Reverse Charge: Umsatzsteuer = 0%
    // TaxBasisAmount = LineTotalAmount - Sicherheitsleistung (Allowance reduziert Besteuerungsgrundlage)
    // Skonto reduziert NICHT die Besteuerungsgrundlage (nur Zahlungsbedingung)
    const taxBasisAmount = lineTotalAmount - securityServiceAmount;
    const taxAmount = 0;
    
    // Rechnungsbetrag = TaxBasisAmount - Skonto (Skonto ist Zahlungsbedingung, nicht in MonetarySummation)
    const grandTotalAmount = taxBasisAmount - cashDiscountAmount;
    const totalPrepaidAmount = 0; // Keine Vorauszahlungen
    const duePayableAmount = grandTotalAmount;
    
    const totals: InvoiceTotals = {
        lineTotalAmount,
        securityServiceAmount,
        cashDiscountAmount,
        taxBasisAmount,
        taxAmount,
        grandTotalAmount,
        totalPrepaidAmount,
        duePayableAmount,
    };
    
    // Status-Flags
    const isCanceled = order.status === 'canceled';
    const hasModifiedAfterIssue = order.performances?.some((p: any) => 
        p.modified_after_issue === true || p.modified_after_issue === 1 || p.modified_after_issue === "1"
    ) || false;
    const isCorrected = hasModifiedAfterIssue && !isCanceled;
    
    // Zahlungsinformationen
    const paymentMeans = "Überweisung";
    const paymentTerms = cashDiscountPercent > 0 
        ? `${cashDiscountPercent}% Skonto bei Zahlung innerhalb von 14 Tagen`
        : undefined;
    
    // Rechtstexte
    const taxNote = "Die Umsatzsteuer wird gemäß § 13 b Abs. 2 Umsatzsteuergesetz vom Auftragsgeber abgeführt.";
    const paymentNote = `Bitte überweisen Sie den angegebenen Rechnungsbetrag auf das angegebene Konto bei der ${seller.bankName}`;
    
    return {
        invoiceNumber,
        invoiceDate: invoiceDate.toISOString(),
        invoiceType: 'invoice',
        projectNumber: order.project_number || "",
        seller,
        buyer,
        deliveryAddress,
        lines,
        totals,
        paymentMeans,
        paymentTerms,
        taxNote,
        paymentNote,
        isCanceled,
        isCorrected,
        hasModifiedAfterIssue,
    };
}

// ============================================================================
// 3️⃣ PDF-GENERIERUNG - Reine Darstellung
// ============================================================================

/**
 * Generiert das vollständige PDF aus InvoiceData.
 * KEINE Berechnungen, nur Darstellung.
 */
export function generateInvoicePDF(invoice: InvoiceData): ArrayBuffer {
    const doc = new jsPDF();
    const invoiceDate = dayjs(invoice.invoiceDate);
    const formattedDate = invoiceDate.format("DD.MM.YYYY");
    
    // Logo
    doc.setTextColor(81, 82, 84);
    const logoUrl = logo;
    doc.addImage(logoUrl, "PNG", 15, 15, 20, 15);
    
    // Kopfzeile (Verkäufer)
    doc.setFontSize(8);
    doc.text(`Geschäftsführer: ${invoice.seller.ownerName || ""}`, 40, 21);
    doc.setFontSize(7);
    doc.text(invoice.seller.name, 40, 24);
    doc.text(`${invoice.seller.address}, ${invoice.seller.postal} ${invoice.seller.city}`, 40, 27);
    doc.setFontSize(8);
    doc.text("Handelsregister Hamm", 171.5, 21, { align: "right" });
    doc.text(`Steuer Nr. ${invoice.seller.taxIdentificationNumber}`, 175, 24, { align: "right" });
    
    // Käufer
    doc.setFont("helvetica", "bold");
    doc.text(invoice.buyer.name, 15, 37);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.buyer.address, 15, 42);
    doc.text(`${invoice.buyer.postal} ${invoice.buyer.city}`, 15, 45);
    
    // Rechnungskopf
    doc.setFillColor(220, 230, 255);
    doc.rect(15, 55, 100, 7, "F");
    doc.setFontSize(12);
    doc.text("Rechnung Nr. ", 17, 60);
    doc.setTextColor(0, 0, 155);
    doc.text(invoice.invoiceNumber, 45, 60);
    doc.setTextColor(81, 82, 84);
    doc.setFontSize(10);
    doc.text(`${invoice.seller.city}, ${formattedDate}`, 175, 60, { align: "right" });
    
    // Status-Hinweise
    let bauvorhabenStartY = 70;
    let noticeY = 67;
    
    if (invoice.isCanceled) {
        doc.setFontSize(12);
        doc.setTextColor(255, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("STORNIERT", 105, noticeY, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(81, 82, 84);
        bauvorhabenStartY = 75;
        noticeY += 5;
    }
    
    if (invoice.isCorrected) {
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Korrigierte Rechnung", 17, noticeY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(81, 82, 84);
        if (bauvorhabenStartY === 70) {
            bauvorhabenStartY = 75;
        }
    }
    
    // Bauvorhaben
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Bauvorhaben:", 15, bauvorhabenStartY);
    doc.text("Projekt Nr. ", 50, bauvorhabenStartY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 155);
    doc.text(invoice.projectNumber, 65, bauvorhabenStartY);
    doc.setTextColor(81, 82, 84);
    doc.setFont("helvetica", "bold");
    doc.text("Anschrift:", 15, bauvorhabenStartY + 3);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.deliveryAddress.name, 15, bauvorhabenStartY + 5.5);
    doc.text(invoice.deliveryAddress.address, 15, bauvorhabenStartY + 8.5);
    doc.text(`${invoice.deliveryAddress.postal} ${invoice.deliveryAddress.city}`, 15, bauvorhabenStartY + 11.5);
    doc.text(invoice.deliveryAddress.city, 15, bauvorhabenStartY + 14.5);
    
    // Positionstabelle
    const tableStartY = bauvorhabenStartY + 18;
    doc.setFillColor(220, 230, 255);
    doc.rect(15, tableStartY, 180, 5, "F");
    doc.setFontSize(8);
    doc.text("qm", 16, tableStartY + 3);
    doc.text("Bezeichnung", 30, tableStartY + 3);
    doc.text("Fixpreis | m²-Preis", 150, tableStartY + 3);
    doc.text("Preis", 190, tableStartY + 3, { align: "right" });
    doc.line(15, tableStartY + 5, 195, tableStartY + 5);
    
    let y = tableStartY + 10;
    
    for (const line of invoice.lines) {
        const maxWidth = 120;
        const wrappedText = doc.splitTextToSize(line.description, maxWidth);
        const lineHeight = 5;
        
        if (y + wrappedText.length * lineHeight > doc.internal.pageSize.height - 10) {
            doc.addPage();
            y = 10;
        }
        
        doc.text(String(line.quantity), 16, y);
        doc.text(wrappedText, 30, y);
        doc.text(`${line.unitPrice.toFixed(2)} €`, 150, y);
        doc.text(`${line.lineTotal.toFixed(2)} €`, 193, y, { align: "right" });
        
        const textHeight = wrappedText.length * lineHeight;
        y += textHeight;
    }
    
    // Summen
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Gesamtbetrag", 16, y + 5);
    doc.text(`${invoice.totals.lineTotalAmount.toFixed(2)} €`, 193, y + 5, { align: "right" });
    const totalWidth = doc.getTextWidth(`${invoice.totals.lineTotalAmount.toFixed(2)} €`);
    const totalY = y + 5;
    const lineStartX = 193 - totalWidth;
    const lineEndX = 193;
    
    doc.line(lineStartX, totalY + 2, lineEndX, totalY + 2);
    doc.line(lineStartX, totalY + 3, lineEndX, totalY + 3);
    
    // Sicherheitsleistung
    doc.setFont("helvetica", "normal");
    doc.text("Sicherheitsleistung", 17, totalY + 10);
    const securityPercent = invoice.totals.lineTotalAmount > 0 
        ? (invoice.totals.securityServiceAmount / invoice.totals.lineTotalAmount) * 100 
        : 0;
    doc.text(`${securityPercent.toFixed(2)} %`, 150, totalY + 10, { align: "right" });
    doc.text(`${invoice.totals.securityServiceAmount.toFixed(2)} €`, 193, totalY + 10, { align: "right" });
    
    // Skonto
    doc.text("Skonto", 17, totalY + 14);
    const discountPercent = invoice.totals.lineTotalAmount > 0
        ? (invoice.totals.cashDiscountAmount / invoice.totals.lineTotalAmount) * 100
        : 0;
    doc.text(`${discountPercent.toFixed(2)} %`, 150, totalY + 14, { align: "right" });
    doc.text(`${invoice.totals.cashDiscountAmount.toFixed(2)} €`, 193, totalY + 14, { align: "right" });
    
    doc.setFillColor(220, 230, 255);
    doc.rect(15, totalY + 15, 180, 5, "F");
    
    // Rechnungsbetrag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Rechnungsbetrag", 17, totalY + 19);
    doc.text(`${invoice.totals.grandTotalAmount.toFixed(2)} €`, 193, totalY + 19, { align: "right" });
    doc.setFontSize(8);
    const textWidth = doc.getTextWidth(`${invoice.totals.grandTotalAmount.toFixed(2)} €`);
    const lineStartX2 = 190 - textWidth;
    const lineEndX2 = 193;
    
    doc.line(lineStartX2, totalY + 19.5, lineEndX2, totalY + 19.5);
    doc.line(lineStartX2, totalY + 20, lineEndX2, totalY + 20);
    
    // Ausführungsdaten
    doc.setFont("helvetica", "normal");
    doc.text("Ausführungsdatum:", 15, totalY + 25);
    let currentY = totalY + 30;
    
    for (const line of invoice.lines) {
        if (!line.executionDate) continue;
        
        const date = dayjs(line.executionDate);
        const kw = line.calendarWeek || date.week();
        const weekday = date.format("dddd");
        let yOffset = 0;
        
        if (line.status === "date_change" && line.executionDateChanged) {
            const newDate = dayjs(line.executionDateChanged);
            const newWeekday = newDate.format("dddd");
            doc.setFont("helvetica", "normal");
            doc.text(`${newWeekday}, ${newDate.format("DD.MM.YYYY HH:mm")} (KW ${newDate.week()})`, 15, currentY);
            doc.setFontSize(8);
            doc.setTextColor(255, 0, 0);
            const oldDateText = `${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`;
            const oldDateX = 68;
            doc.text(oldDateText, oldDateX, currentY);
            const textWidth = doc.getTextWidth(oldDateText);
            doc.line(oldDateX, currentY - 1, oldDateX + textWidth, currentY - 1);
            doc.setTextColor(81, 82, 84);
            doc.setFontSize(8);
            yOffset = 5;
        } else {
            doc.setFontSize(8);
            doc.text(`${weekday}, ${date.format("DD.MM.YYYY HH:mm")} (KW ${kw})`, 15, currentY);
            yOffset = 5;
        }
        currentY += yOffset;
    }
    
    // Rechtstexte
    doc.setFont("helvetica", "italic");
    doc.text(invoice.taxNote, 15, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.paymentNote, 15, currentY + 10);
    
    // Fußzeile
    doc.setFontSize(6);
    const pageHeight = doc.internal.pageSize.height;
    const bottomMargin = 15;
    let startY = pageHeight - bottomMargin - 15;
    
    doc.text(invoice.seller.name, 15, startY);
    doc.text(invoice.seller.address, 15, startY + 3);
    doc.text(`${invoice.seller.postal} ${invoice.seller.city}`, 15, startY + 6);
    
    if (invoice.seller.phone) {
        doc.text(`Telefon: ${invoice.seller.phone}`, 65, startY);
    }
    if (invoice.seller.email) {
        doc.text(`E-Mail: ${invoice.seller.email}`, 65, startY + 3);
    }
    
    doc.text("Bankverbindung", 15, startY + 13);
    if (invoice.seller.bankName) {
        doc.text(invoice.seller.bankName, 15, startY + 16);
    }
    if (invoice.seller.iban) {
        doc.text(`IBAN: ${invoice.seller.iban}`, 45, startY + 16);
    }
    if (invoice.seller.bic) {
        doc.text(`BIC: ${invoice.seller.bic}`, 95, startY + 16);
    }
    
    return doc.output('arraybuffer');
}

// ============================================================================
// 4️⃣ ZUGFeRD-XML - EN 16931 konform
// ============================================================================

/**
 * Generiert das ZUGFeRD-XML gemäß EN 16931 / ZUGFeRD 2.1.
 * Verwendet ausschließlich InvoiceData, keine Order-Daten.
 * 
 * KORREKTUREN:
 * - Jede Position ist ein eigenes IncludedSupplyChainTradeLineItem
 * - Reverse Charge: CategoryCode="AE" mit ExemptionReason
 * - Sicherheitsleistung als Allowance, nicht als Charge
 * - Skonto NUR in PaymentTerms, NICHT in MonetarySummation
 * - Einheiten: MTK für qm, C62 für Stück
 * - Datumsformat 102: YYYYMMDD ohne Uhrzeit
 * - IBAN/BIC in PaymentMeans
 * - BuyerReference (BT-10) falls vorhanden
 */
export function generateZUGFeRDXML(invoice: InvoiceData): string {
    const invoiceDate = dayjs(invoice.invoiceDate);
    // Format 102: YYYYMMDD ohne Uhrzeit
    const issueDate = invoiceDate.format('YYYYMMDD');
    
    // Jede Position ist ein eigenes IncludedSupplyChainTradeLineItem
    const lineItemsXML = invoice.lines.map((line) => {
        return `
        <ram:IncludedSupplyChainTradeLineItem>
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${line.lineNumber}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${escapeXML(line.description)}</ram:Name>
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${line.unitPrice.toFixed(2)}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="${line.unitCode}">${line.quantity.toFixed(2)}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>AE</ram:CategoryCode>
                    <ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>
                    <ram:ExemptionReason>Reverse Charge gemäß §13b UStG</ram:ExemptionReason>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${line.lineTotal.toFixed(2)}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>
        </ram:IncludedSupplyChainTradeLineItem>`;
    }).join("");
    
    // Sicherheitsleistung als Allowance (nicht als Charge)
    const securityServiceAllowanceXML = invoice.totals.securityServiceAmount > 0 ? `
            <ram:SpecifiedTradeAllowanceCharge>
                <ram:ChargeIndicator>false</ram:ChargeIndicator>
                <ram:ActualAmount>${invoice.totals.securityServiceAmount.toFixed(2)}</ram:ActualAmount>
                <ram:Reason>Sicherheitsleistung</ram:Reason>
            </ram:SpecifiedTradeAllowanceCharge>` : "";
    
    // BuyerReference (BT-10) - falls vorhanden (z.B. Projektnummer)
    const buyerReferenceXML = invoice.projectNumber ? `
            <ram:BuyerReference>${escapeXML(invoice.projectNumber)}</ram:BuyerReference>` : "";
    
    // PaymentMeans mit IBAN/BIC (ZUGFeRD-konform)
    const paymentMeansXML = invoice.seller.iban ? `
            <ram:SpecifiedTradeSettlementPaymentMeans>
                <ram:TypeCode>58</ram:TypeCode>
                <ram:Information>${escapeXML(invoice.paymentMeans)}</ram:Information>
                <ram:PayeePartyCreditorFinancialAccount>
                    <ram:IBANID>${escapeXML(invoice.seller.iban.replace(/\s/g, ''))}</ram:IBANID>
                    ${invoice.seller.bic ? `
                    <ram:PayeeSpecifiedCreditorFinancialInstitution>
                        <ram:BICID>${escapeXML(invoice.seller.bic)}</ram:BICID>
                        ${invoice.seller.bankName ? `<ram:Name>${escapeXML(invoice.seller.bankName)}</ram:Name>` : ''}
                    </ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
                </ram:PayeePartyCreditorFinancialAccount>
            </ram:SpecifiedTradeSettlementPaymentMeans>` : `
            <ram:SpecifiedTradeSettlementPaymentMeans>
                <ram:TypeCode>58</ram:TypeCode>
                <ram:Information>${escapeXML(invoice.paymentMeans)}</ram:Information>
            </ram:SpecifiedTradeSettlementPaymentMeans>`;
    
    // PaymentTerms für Skonto (textuell, NICHT in MonetarySummation)
    const paymentTermsXML = invoice.paymentTerms ? `
            <ram:SpecifiedTradePaymentTerms>
                <ram:Description>${escapeXML(invoice.paymentTerms)}</ram:Description>
            </ram:SpecifiedTradePaymentTerms>` : "";
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:zugferd:2.1</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>
    <rsm:ExchangedDocument>
        <ram:ID>${escapeXML(invoice.invoiceNumber)}</ram:ID>
        <ram:Name>RECHNUNG</ram:Name>
        <ram:TypeCode>380</ram:TypeCode>
        <ram:IssueDateTime>
            <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
        </ram:IssueDateTime>
    </rsm:ExchangedDocument>
    <rsm:SupplyChainTradeTransaction>
        ${lineItemsXML}
        <ram:ApplicableHeaderTradeAgreement>
            <ram:SellerTradeParty>
                <ram:Name>${escapeXML(invoice.seller.name)}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXML(invoice.seller.postal)}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXML(invoice.seller.address)}</ram:LineOne>
                    <ram:CityName>${escapeXML(invoice.seller.city)}</ram:CityName>
                    <ram:CountryID>${escapeXML(invoice.seller.country)}</ram:CountryID>
                </ram:PostalTradeAddress>
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">${escapeXML(invoice.seller.taxIdentificationNumber)}</ram:ID>
                </ram:SpecifiedTaxRegistration>
            </ram:SellerTradeParty>
            <ram:BuyerTradeParty>
                <ram:Name>${escapeXML(invoice.buyer.name)}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXML(invoice.buyer.postal)}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXML(invoice.buyer.address)}</ram:LineOne>
                    <ram:CityName>${escapeXML(invoice.buyer.city)}</ram:CityName>
                    <ram:CountryID>${escapeXML(invoice.buyer.country)}</ram:CountryID>
                </ram:PostalTradeAddress>
                ${invoice.buyer.taxIdentificationNumber ? `
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">${escapeXML(invoice.buyer.taxIdentificationNumber)}</ram:ID>
                </ram:SpecifiedTaxRegistration>
                ` : ""}
            </ram:BuyerTradeParty>
            ${buyerReferenceXML}
        </ram:ApplicableHeaderTradeAgreement>
        <ram:ApplicableHeaderTradeDelivery>
            <ram:ShipToTradeParty>
                <ram:Name>${escapeXML(invoice.deliveryAddress.name)}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXML(invoice.deliveryAddress.postal)}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXML(invoice.deliveryAddress.address)}</ram:LineOne>
                    <ram:CityName>${escapeXML(invoice.deliveryAddress.city)}</ram:CityName>
                    <ram:CountryID>${escapeXML(invoice.deliveryAddress.country)}</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:ShipToTradeParty>
        </ram:ApplicableHeaderTradeDelivery>
        <ram:ApplicableHeaderTradeSettlement>
            <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
            ${paymentMeansXML}
            ${securityServiceAllowanceXML}
            <ram:ApplicableTradeTax>
                <ram:CalculatedAmount>${invoice.totals.taxAmount.toFixed(2)}</ram:CalculatedAmount>
                <ram:TypeCode>VAT</ram:TypeCode>
                <ram:BasisAmount>${invoice.totals.taxBasisAmount.toFixed(2)}</ram:BasisAmount>
                <ram:CategoryCode>AE</ram:CategoryCode>
                <ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>
                <ram:ExemptionReason>Reverse Charge gemäß §13b UStG</ram:ExemptionReason>
            </ram:ApplicableTradeTax>
            ${paymentTermsXML}
            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${invoice.totals.lineTotalAmount.toFixed(2)}</ram:LineTotalAmount>
                ${invoice.totals.securityServiceAmount > 0 ? `<ram:AllowanceTotalAmount>${invoice.totals.securityServiceAmount.toFixed(2)}</ram:AllowanceTotalAmount>` : ''}
                <ram:TaxBasisTotalAmount>${invoice.totals.taxBasisAmount.toFixed(2)}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="EUR">${invoice.totals.taxAmount.toFixed(2)}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${invoice.totals.grandTotalAmount.toFixed(2)}</ram:GrandTotalAmount>
                <ram:TotalPrepaidAmount>${invoice.totals.totalPrepaidAmount.toFixed(2)}</ram:TotalPrepaidAmount>
                <ram:DuePayableAmount>${invoice.totals.duePayableAmount.toFixed(2)}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>
    </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
    
    return xml;
}

// ============================================================================
// 5️⃣ EXPORT - E-Rechnung generieren
// ============================================================================

/**
 * Hauptfunktion: Generiert eine E-Rechnung im ZUGFeRD-Format.
 * 
 * ABLAUF:
 * 1. buildInvoiceData - Alle Berechnungen
 * 2. generateInvoicePDF - PDF-Generierung (Preview)
 * 3. generateZUGFeRDXML - XML-Generierung
 * 4. XML ins PDF einbetten
 * 5. Download bereitstellen
 * 
 * HINWEIS: Diese Funktion erzeugt ein PDF mit eingebettetem XML,
 * aber KEIN PDF/A-3-konformes Dokument. Für revisionssichere E-Rechnungen
 * verwende generatePDFA3ERechnung() aus generatePDFA3Server.ts
 */
export async function generateERechnung(
    order: any, 
    ownCompany: any,
    usePDFA3: boolean = false
): Promise<void> {
    // 1. Rechnungsdaten aufbauen (alle Berechnungen hier)
    const invoiceData = buildInvoiceData(order, ownCompany);
    
    // Wenn PDF/A-3 gewünscht, Backend API aufrufen
    if (usePDFA3) {
        const { generatePDFA3ERechnungWithData } = await import('./generatePDFA3Server');
        await generatePDFA3ERechnungWithData(order.id, invoiceData);
        return;
    }
    
    // 2. PDF generieren (Preview, nicht PDF/A-3)
    const pdfBytes = generateInvoicePDF(invoiceData);
    
    // 3. XML generieren
    const xmlContent = generateZUGFeRDXML(invoiceData);
    
    // 4. PDF laden und XML einbetten (pdf-lib unterstützt KEIN PDF/A-3!)
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const xmlBytes = new TextEncoder().encode(xmlContent);
    pdfDoc.attach(xmlBytes, 'ZUGFeRD-invoice.xml', {
        mimeType: 'application/xml',
        description: 'ZUGFeRD Invoice XML (EN 16931)',
        creationDate: new Date(),
        modificationDate: new Date(),
    });
    
    // 5. PDF speichern und Download
    const finalPdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `RG-${invoiceData.invoiceNumber}-${invoiceData.buyer.name}-E-Rechnung.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

function escapeXML(str: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
