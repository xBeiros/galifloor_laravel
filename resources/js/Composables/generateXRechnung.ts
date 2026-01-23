/**
 * XRechnung XML Generator
 * 
 * Generiert XRechnung-konformes XML für öffentliche Auftraggeber (Behörden).
 * XRechnung ist ein reines XML-Format ohne PDF-Anhang.
 * 
 * Spezifikation: XRechnung 2.3.1 / EN 16931
 * Ab 2027 verpflichtend für öffentliche Auftraggeber in Deutschland.
 * 
 * Unterschiede zu ZUGFeRD:
 * - Reines XML-Format (kein PDF)
 * - CII (Cross Industry Invoice) Standard
 * - Andere Namespaces und Struktur
 * - Zusätzliche Pflichtfelder für Behörden
 */

import dayjs from "dayjs";
import type { InvoiceData } from "./generateERechnung";

/**
 * Generiert XRechnung XML aus InvoiceData.
 * 
 * @param invoice - InvoiceData Objekt (Single Source of Truth)
 * @returns XRechnung-konformes XML als String
 */
export function generateXRechnungXML(invoice: InvoiceData): string {
    const invoiceDate = dayjs(invoice.invoiceDate);
    const issueDate = invoiceDate.format('YYYY-MM-DD');
    
    // Positionen (Invoice Lines)
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
    
    // Sicherheitsleistung als Allowance
    const securityServiceAllowanceXML = invoice.totals.securityServiceAmount > 0 ? `
            <ram:SpecifiedTradeAllowanceCharge>
                <ram:ChargeIndicator>false</ram:ChargeIndicator>
                <ram:ActualAmount>${invoice.totals.securityServiceAmount.toFixed(2)}</ram:ActualAmount>
                <ram:ReasonCode>AAG</ram:ReasonCode>
                <ram:Reason>Sicherheitsleistung</ram:Reason>
            </ram:SpecifiedTradeAllowanceCharge>` : "";
    
    // BuyerReference (BT-10) - Projektnummer
    const buyerReferenceXML = invoice.projectNumber ? `
            <ram:BuyerReference>${escapeXML(invoice.projectNumber)}</ram:BuyerReference>` : "";
    
    // PaymentMeans mit IBAN/BIC
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
    
    // PaymentTerms für Skonto
    const paymentTermsXML = invoice.paymentTerms ? `
            <ram:SpecifiedTradePaymentTerms>
                <ram:Description>${escapeXML(invoice.paymentTerms)}</ram:Description>
            </ram:SpecifiedTradePaymentTerms>` : "";
    
    // XRechnung XML (CII D16B Format)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
    <rsm:ExchangedDocumentContext>
        <ram:GuidelineSpecifiedDocumentContextParameter>
            <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_2.3.1</ram:ID>
        </ram:GuidelineSpecifiedDocumentContextParameter>
    </rsm:ExchangedDocumentContext>
    <rsm:ExchangedDocument>
        <ram:ID>${escapeXML(invoice.invoiceNumber)}</ram:ID>
        <ram:Name>RECHNUNG</ram:Name>
        <ram:TypeCode>380</ram:TypeCode>
        <ram:IssueDateTime>
            <udt:DateTimeString format="102">${invoiceDate.format('YYYYMMDD')}</udt:DateTimeString>
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

/**
 * Hilfsfunktion: Escaped XML-Sonderzeichen
 */
function escapeXML(str: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
