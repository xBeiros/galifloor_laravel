import jsPDF from 'jspdf';
import dayjs from 'dayjs';

export interface CertificateData {
    employee: {
        first_name: string;
        last_name: string;
        birth_date: string;
        address?: string;
    };
    work_date: string;
    certificate_type: 'work_confirmation' | 'attendance' | 'other';
    work_hours?: number;
    description?: string;
    custom_text?: string;
}

export const generateCertificatePDF = (data: CertificateData) => {
    const doc = new jsPDF();
    const currentDate = dayjs().format('DD.MM.YYYY');
    const workDate = dayjs(data.work_date).format('DD.MM.YYYY');
    
    // Farben definieren
    const primaryColor = [37, 99, 235]; // Indigo
    const textColor = [51, 51, 51]; // Dark gray
    const lightGray = [241, 245, 249]; // Light gray background
    
    // PDF-Einstellungen
    doc.setProperties({
        title: 'Bescheinigung',
        subject: 'Arbeitsbescheinigung',
        author: 'Gali Floor Industriebodentechnik',
        creator: 'Gali Floor System'
    });

    // Header mit Firmenlogo-Style
    doc.setFillColor(...primaryColor);
    doc.rect(20, 20, 170, 25, 'F');
    
    // Firmenname
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Gali Floor Industriebodentechnik', 25, 35);
    
    // Adresse
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Josefstraße 1, 59067 Hamm', 25, 42);
    doc.text('Telefon: 02381 / 27 95 644 | Handy: 0176 624 98101', 25, 47);
    
    // Titel
    doc.setTextColor(...textColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BESCHEINIGUNG', 105, 65, { align: 'center' });
    
    // Linie unter dem Titel
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 70, 190, 70);
    
    // Hauptinhalt
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Bescheinigt wird hiermit, dass', 25, 85);
    
    // Mitarbeiter-Info Box
    doc.setFillColor(...lightGray);
    doc.rect(25, 90, 165, 35, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.rect(25, 90, 165, 35, 'S');
    
    // Mitarbeiterdaten
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 30, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.employee.first_name} ${data.employee.last_name}`, 50, 100);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Geburtsdatum:', 30, 108);
    doc.setFont('helvetica', 'normal');
    doc.text(data.employee.birth_date, 70, 108);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Anschrift:', 30, 116);
    doc.setFont('helvetica', 'normal');
    doc.text(data.employee.address || 'Nicht angegeben', 60, 116);
    
    // Arbeitsdetails Box
    doc.setFillColor(248, 250, 252);
    doc.rect(25, 130, 165, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(25, 130, 165, 25, 'S');
    
    // Arbeitsdetails Text
    doc.setFont('helvetica', 'normal');
    doc.text(`am ${workDate} `, 30, 140);
    
    // Bescheinigungstyp-spezifischer Text
    let workTypeText = '';
    switch(data.certificate_type) {
        case 'work_confirmation':
            workTypeText = `in unserem Unternehmen gearbeitet hat.`;
            if (data.work_hours) {
                workTypeText += `\nArbeitszeit: ${data.work_hours} Stunden`;
            }
            break;
        case 'attendance':
            workTypeText = 'anwesend war.';
            break;
        default:
            workTypeText = 'die angegebene Tätigkeit ausgeführt hat.';
    }
    
    doc.text(workTypeText, 30, 145);
    
    // Zusätzliche Beschreibung
    if (data.description) {
        doc.setFont('helvetica', 'bold');
        doc.text('Beschreibung:', 30, 160);
        doc.setFont('helvetica', 'normal');
        const descriptionLines = doc.splitTextToSize(data.description, 140);
        doc.text(descriptionLines, 30, 165);
    }
    
    // Zusätzlicher Text
    if (data.custom_text) {
        doc.setFont('helvetica', 'bold');
        doc.text('Zusätzliche Angaben:', 30, 180);
        doc.setFont('helvetica', 'normal');
        const customLines = doc.splitTextToSize(data.custom_text, 140);
        doc.text(customLines, 30, 185);
    }
    
    // Unterschriftsbereich
    doc.setFont('helvetica', 'normal');
    doc.text(`Hamm, ${currentDate}`, 25, 220);
    
    // Linie für Unterschrift
    doc.setDrawColor(...textColor);
    doc.setLineWidth(0.5);
    doc.line(120, 240, 190, 240);
    
    // Firmenname und Unterschrift
    doc.setFont('helvetica', 'bold');
    doc.text('Gali Floor Industriebodentechnik', 120, 250);
    doc.setFont('helvetica', 'normal');
    doc.text('Stefan Asenov', 120, 255);
    doc.text('Geschäftsführer', 120, 260);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Diese Bescheinigung wurde elektronisch erstellt und ist ohne Unterschrift gültig.', 25, 280);
    
    // Datei herunterladen
    const fileName = `Bescheinigung_${data.employee.first_name}_${data.employee.last_name}_${workDate.replace(/\./g, '-')}.pdf`;
    doc.save(fileName);
    
    return doc;
};

export const generateCertificateAndUpload = async (data: CertificateData, employeeId: number) => {
    try {
        // CSRF-Token aus dem Meta-Tag holen
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!csrfToken) {
            throw new Error('CSRF-Token nicht gefunden');
        }

        // PDF generieren
        const pdf = generateCertificatePDF(data);
        
        // PDF als Blob konvertieren
        const pdfBlob = pdf.output('blob');
        
        // FormData für Upload erstellen
        const formData = new FormData();
        formData.append('file', pdfBlob, `bescheinigung_${dayjs(data.work_date).format('Y-m-d')}.pdf`);
        formData.append('_token', csrfToken);
        
        // PDF hochladen
        const response = await fetch(`/employee/${employeeId}/upload-document`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
        });
        
        if (response.ok) {
            const result = await response.json();
            return {
                success: true,
                document: result,
                downloadUrl: result.download_url || `/storage/${result.file_path}`
            };
        } else {
            const errorText = await response.text();
            console.error('Upload-Fehler:', response.status, errorText);
            throw new Error(`Upload fehlgeschlagen: ${response.status} ${errorText}`);
        }
    } catch (error) {
        console.error('Upload-Fehler:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
