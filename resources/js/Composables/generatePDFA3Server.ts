/**
 * Serverseitige PDF/A-3 Generierung - Client-Side Wrapper
 * 
 * Diese Datei enthält die Client-seitige Logik zum Aufruf des Backend-Services
 * für die PDF/A-3 Generierung. Die eigentliche PDF/A-3 Erzeugung erfolgt
 * serverseitig (Java/iText oder .NET), da JavaScript-Bibliotheken wie pdf-lib
 * keine vollständige PDF/A-3 Unterstützung bieten.
 * 
 * Workflow:
 * 1. Frontend generiert InvoiceData und ZUGFeRD XML
 * 2. Frontend sendet Daten an Backend API
 * 3. Backend ruft Java Service auf (iText 7)
 * 4. Java Service erzeugt PDF/A-3 mit eingebettetem XML
 * 5. Backend gibt PDF/A-3 Byte-Stream zurück
 * 6. Frontend lädt PDF herunter
 */

import axios from "axios";
import type { InvoiceData } from "./generateERechnung";
import { generateZUGFeRDXML } from "./generateERechnung";

/**
 * Generiert eine PDF/A-3-konforme E-Rechnung über das Backend.
 * 
 * @param invoiceId - ID der Invoice in der Datenbank
 * @param invoiceData - Optional: InvoiceData Objekt (falls bereits generiert)
 * @returns Promise<void> - Startet Download
 */
export async function generatePDFA3ERechnung(
    invoiceId: number,
    invoiceData?: InvoiceData
): Promise<void> {
    try {
        // Option 1: Backend generiert InvoiceData selbst
        const response = await axios.post(
            `/api/invoices/${invoiceId}/generate-erechnung`,
            {},
            {
                responseType: 'blob',
                headers: {
                    'Accept': 'application/pdf'
                }
            }
        );
        
        // PDF/A-3 herunterladen
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Dateiname aus Response Header oder generieren
        const contentDisposition = response.headers['content-disposition'];
        let filename = `RG-${invoiceId}-E-Rechnung.pdf`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Fehler bei PDF/A-3 Generierung:', error);
        throw error;
    }
}

/**
 * Generiert eine PDF/A-3-konforme E-Rechnung mit bereits generiertem InvoiceData.
 * Nützlich, wenn InvoiceData bereits im Frontend vorhanden ist.
 * 
 * @param invoiceId - ID der Invoice
 * @param invoiceData - InvoiceData Objekt
 * @returns Promise<void>
 */
export async function generatePDFA3ERechnungWithData(
    invoiceId: number,
    invoiceData: InvoiceData
): Promise<void> {
    try {
        // ZUGFeRD XML generieren
        const zugferdXML = generateZUGFeRDXML(invoiceData);
        
        // Backend API aufrufen mit InvoiceData und XML
        const response = await axios.post(
            `/api/invoices/${invoiceId}/generate-erechnung`,
            {
                invoiceData,
                zugferdXML
            },
            {
                responseType: 'blob',
                headers: {
                    'Accept': 'application/pdf',
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // PDF/A-3 herunterladen
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `RG-${invoiceData.invoiceNumber}-E-Rechnung.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Fehler bei PDF/A-3 Generierung:', error);
        throw error;
    }
}

/**
 * Validiert ein PDF/A-3 Dokument (optional, erfordert Backend-Support).
 * 
 * @param pdfFile - PDF File oder Blob
 * @returns Promise<ValidationResult>
 */
export async function validatePDFA3(pdfFile: File | Blob): Promise<{
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
}> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    
    try {
        const response = await axios.post(
            '/api/validate-pdfa3',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Fehler bei PDF/A-3 Validierung:', error);
        throw error;
    }
}
