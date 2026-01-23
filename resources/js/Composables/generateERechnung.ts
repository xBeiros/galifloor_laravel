import logo from "@/Assets/img.png";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import "dayjs/locale/de";
import { PDFDocument } from "pdf-lib";
import { generateInvoice } from "./generateInvoicePDF";
dayjs.extend(weekOfYear);
dayjs.locale('de');

/**
 * Generiert eine E-Rechnung im ZUGFeRD-Format (PDF + XML nach EN 16931)
 * ZUGFeRD ist ein hybrides Format, das ein PDF mit eingebettetem XML enthält
 * 
 * WICHTIG: Ab 2026 ist die E-Rechnung Pflicht für alle Unternehmen
 * - Empfangspflicht seit 1. Januar 2025
 * - Versandregelung bis 31. Dezember 2026: noch PDF möglich
 * - Ausnahme Kleinunternehmer bis Ende 2027
 * - Formate: XRechnung oder ZUGFeRD
 * - Archivierung: 10 Jahre revisionssicher
 */
export const generateERechnung = async (orderr: any, ownCompany: any) => {
    const invoiceDate = orderr?.issued_at ? dayjs(orderr.issued_at) : dayjs();
    const order = orderr;
    
    // Berechne Beträge
    let totalAmount = 0;
    if (order.performances) {
        for (const performance of order.performances) {
            if (performance.status !== "canceled") {
                const qm = Number(performance.qm) || 0;
                const price = Number(performance.price) || 0;
                const total = performance.flatrate ? price : qm * price;
                totalAmount += total;
            }
        }
    }
    
    const securityServicePercent = Number(order.company.security_service) || 0;
    const cashDiscountPercent = Number(order.company.cash_discount) || 0;
    const securityService = totalAmount / 100 * securityServicePercent;
    const cashDiscount = totalAmount / 100 * cashDiscountPercent;
    const invoiceAmount = totalAmount - securityService - cashDiscount;
    
    // Generiere zunächst das normale PDF (für die visuelle Darstellung)
    const doc = new jsPDF();
    // Verwende die gleiche Logik wie generateInvoice, aber ohne Download
    // Hier wird nur das PDF erstellt, um es dann mit XML zu erweitern
    
    // Generiere das XML gemäß EN 16931 / ZUGFeRD
    const xmlContent = generateZUGFeRDXML(order, ownCompany, invoiceAmount, totalAmount, securityService, cashDiscount, cashDiscountPercent, invoiceDate);
    
    // Erstelle das PDF mit pdf-lib (um XML einbetten zu können)
    // Wir müssen das PDF neu erstellen, da jsPDF keine XML-Attachments unterstützt
    const pdfDoc = await PDFDocument.create();
    
    // Füge Seiten vom normalen PDF hinzu (vereinfacht - in Produktion sollte das vollständige PDF kopiert werden)
    // Für jetzt erstellen wir eine einfache Seite
    const page = pdfDoc.addPage([595, 842]); // A4 in Points
    
    // Generiere das vollständige PDF mit generateInvoice und konvertiere es
    // Da jsPDF keine direkte XML-Einbettung unterstützt, verwenden wir pdf-lib
    // Erstelle ein temporäres PDF mit jsPDF
    const tempDoc = new jsPDF();
    tempDoc.text("E-Rechnung - ZUGFeRD Format", 20, 20);
    tempDoc.text(`Rechnung Nr: ${order.year}-${order.order_number}`, 20, 30);
    tempDoc.text(`Datum: ${invoiceDate.format("DD.MM.YYYY")}`, 20, 40);
    tempDoc.text(`Firma: ${order.company?.name}`, 20, 50);
    tempDoc.text(`Betrag: ${invoiceAmount.toFixed(2)} EUR`, 20, 60);
    tempDoc.text("Hinweis: Diese E-Rechnung enthält strukturierte XML-Daten", 20, 80);
    tempDoc.text("gemäß EN 16931 Standard für elektronische Rechnungen.", 20, 90);
    
    const tempPdfBytes = tempDoc.output('arraybuffer');
    const tempPdfDoc = await PDFDocument.load(tempPdfBytes);
    const [copiedPage] = await pdfDoc.copyPages(tempPdfDoc, [0]);
    pdfDoc.addPage(copiedPage);
    
    // Füge das XML als Attachment hinzu (ZUGFeRD-konform)
    const xmlBytes = new TextEncoder().encode(xmlContent);
    pdfDoc.attach(xmlBytes, 'ZUGFeRD-invoice.xml', {
        mimeType: 'application/xml',
        description: 'ZUGFeRD Invoice XML (EN 16931)',
        creationDate: new Date(),
        modificationDate: new Date(),
    });
    
    // Speichere das PDF
    const finalPdfBytes = await pdfDoc.save();
    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Download
    const link = document.createElement('a');
    link.href = url;
    link.download = `RG-${order.year}-${order.order_number}-${order.company.name}-E-Rechnung.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generiert das XML gemäß EN 16931 / ZUGFeRD Standard
 */
function generateZUGFeRDXML(
    order: any,
    ownCompany: any,
    invoiceAmount: number,
    totalAmount: number,
    securityService: number,
    cashDiscount: number,
    cashDiscountPercent: number,
    invoiceDate: dayjs.Dayjs
): string {
    const invoiceNumber = `${order.year}-${order.order_number}`;
    const issueDate = invoiceDate.format('YYYY-MM-DD');
    const issueTime = invoiceDate.format('HH:mm:ss');
    
    // UUID für die Rechnung generieren
    const invoiceId = generateUUID();
    
    // Steuerbetrag berechnen (19% MwSt. gemäß § 13b UStG wird vom Auftraggeber abgeführt)
    const taxAmount = 0; // Da die Umsatzsteuer vom Auftraggeber abgeführt wird
    
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
        <ram:ID>${escapeXML(invoiceNumber)}</ram:ID>
        <ram:Name>RECHNUNG</ram:Name>
        <ram:TypeCode>380</ram:TypeCode>
        <ram:IssueDateTime>
            <udt:DateTimeString format="102">${issueDate}T${issueTime}</udt:DateTimeString>
        </ram:IssueDateTime>
    </rsm:ExchangedDocument>
    <rsm:SupplyChainTradeTransaction>
        <ram:IncludedSupplyChainTradeLineItem>
            ${order.performances?.map((perf: any, index: number) => {
                if (perf.status === "canceled") return "";
                const qm = Number(perf.qm) || 0;
                const price = Number(perf.price) || 0;
                const lineTotal = perf.flatrate ? price : qm * price;
                return `
            <ram:AssociatedDocumentLineDocument>
                <ram:LineID>${index + 1}</ram:LineID>
            </ram:AssociatedDocumentLineDocument>
            <ram:SpecifiedTradeProduct>
                <ram:Name>${escapeXML(perf.performance || "")}</ram:Name>
            </ram:SpecifiedTradeProduct>
            <ram:SpecifiedLineTradeAgreement>
                <ram:NetPriceProductTradePrice>
                    <ram:ChargeAmount>${price.toFixed(2)}</ram:ChargeAmount>
                </ram:NetPriceProductTradePrice>
            </ram:SpecifiedLineTradeAgreement>
            <ram:SpecifiedLineTradeDelivery>
                <ram:BilledQuantity unitCode="C62">${qm}</ram:BilledQuantity>
            </ram:SpecifiedLineTradeDelivery>
            <ram:SpecifiedLineTradeSettlement>
                <ram:ApplicableTradeTax>
                    <ram:TypeCode>VAT</ram:TypeCode>
                    <ram:CategoryCode>S</ram:CategoryCode>
                    <ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>
                </ram:ApplicableTradeTax>
                <ram:SpecifiedTradeSettlementLineMonetarySummation>
                    <ram:LineTotalAmount>${lineTotal.toFixed(2)}</ram:LineTotalAmount>
                </ram:SpecifiedTradeSettlementLineMonetarySummation>
            </ram:SpecifiedLineTradeSettlement>`;
            }).filter((x: string) => x).join("")}
        </ram:IncludedSupplyChainTradeLineItem>
        <ram:ApplicableHeaderTradeAgreement>
            <ram:SellerTradeParty>
                <ram:Name>${escapeXML(ownCompany?.name || "Gali Floor Industriebodentechnik")}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXML(ownCompany?.postal || "59067")}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXML(ownCompany?.address || "Josefstraße 1")}</ram:LineOne>
                    <ram:CityName>${escapeXML(ownCompany?.city || "Hamm")}</ram:CityName>
                    <ram:CountryID>DE</ram:CountryID>
                </ram:PostalTradeAddress>
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">${escapeXML(ownCompany?.tax_identification_number || "322 5007 4942")}</ram:ID>
                </ram:SpecifiedTaxRegistration>
            </ram:SellerTradeParty>
            <ram:BuyerTradeParty>
                <ram:Name>${escapeXML(order.company?.name || "")}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXML(order.company?.postal || "")}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXML(order.company?.address || "")}</ram:LineOne>
                    <ram:CityName>${escapeXML(order.company?.city || "")}</ram:CityName>
                    <ram:CountryID>DE</ram:CountryID>
                </ram:PostalTradeAddress>
                ${order.company?.tax_identification_number ? `
                <ram:SpecifiedTaxRegistration>
                    <ram:ID schemeID="VA">${escapeXML(order.company.tax_identification_number)}</ram:ID>
                </ram:SpecifiedTaxRegistration>
                ` : ""}
            </ram:BuyerTradeParty>
        </ram:ApplicableHeaderTradeAgreement>
        <ram:ApplicableHeaderTradeDelivery>
            <ram:ShipToTradeParty>
                <ram:Name>${escapeXML(order.construction || "")}</ram:Name>
                <ram:PostalTradeAddress>
                    <ram:PostcodeCode>${escapeXML(order.postal || "")}</ram:PostcodeCode>
                    <ram:LineOne>${escapeXML(order.address || "")}</ram:LineOne>
                    <ram:CityName>${escapeXML(order.city || "")}</ram:CityName>
                    <ram:CountryID>DE</ram:CountryID>
                </ram:PostalTradeAddress>
            </ram:ShipToTradeParty>
        </ram:ApplicableHeaderTradeDelivery>
        <ram:ApplicableHeaderTradeSettlement>
            <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
            <ram:SpecifiedTradeSettlementPaymentMeans>
                <ram:TypeCode>42</ram:TypeCode>
                <ram:Information>Überweisung</ram:Information>
            </ram:SpecifiedTradeSettlementPaymentMeans>
            <ram:ApplicableTradeTax>
                <ram:CalculatedAmount>${taxAmount.toFixed(2)}</ram:CalculatedAmount>
                <ram:TypeCode>VAT</ram:TypeCode>
                <ram:BasisAmount>${totalAmount.toFixed(2)}</ram:BasisAmount>
                <ram:CategoryCode>S</ram:CategoryCode>
                <ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>
            </ram:ApplicableTradeTax>
            <ram:SpecifiedTradePaymentTerms>
                <ram:Description>${cashDiscountPercent > 0 ? `${cashDiscountPercent}% Skonto` : ""}</ram:Description>
                ${cashDiscountPercent > 0 ? `
                <ram:DueDateDateTime>
                    <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
                </ram:DueDateDateTime>
                ` : ""}
            </ram:SpecifiedTradePaymentTerms>
            <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
                <ram:LineTotalAmount>${totalAmount.toFixed(2)}</ram:LineTotalAmount>
                <ram:ChargeTotalAmount>${securityService.toFixed(2)}</ram:ChargeTotalAmount>
                <ram:AllowanceTotalAmount>${cashDiscount.toFixed(2)}</ram:AllowanceTotalAmount>
                <ram:TaxBasisTotalAmount>${totalAmount.toFixed(2)}</ram:TaxBasisTotalAmount>
                <ram:TaxTotalAmount currencyID="EUR">${taxAmount.toFixed(2)}</ram:TaxTotalAmount>
                <ram:GrandTotalAmount>${invoiceAmount.toFixed(2)}</ram:GrandTotalAmount>
                <ram:TotalPrepaidAmount>0.00</ram:TotalPrepaidAmount>
                <ram:DuePayableAmount>${invoiceAmount.toFixed(2)}</ram:DuePayableAmount>
            </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        </ram:ApplicableHeaderTradeSettlement>
    </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
    
    return xml;
}

function escapeXML(str: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

