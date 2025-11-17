<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CertificateController extends Controller
{
    /**
     * Bescheinigung für einen Mitarbeiter erstellen
     */
    public function create(Request $request, $employeeId)
    {
        $request->validate([
            'certificate_type' => 'required|string|in:work_confirmation,attendance,other',
            'work_date' => 'required|date',
            'work_hours' => 'nullable|integer|min:1|max:24',
            'description' => 'nullable|string|max:500',
            'custom_text' => 'nullable|string|max:1000'
        ]);

        $employee = Employee::findOrFail($employeeId);
        
        // PDF generieren
        $pdfPath = $this->generateCertificatePDF($employee, $request->all());
        
        // PDF in Dokumente hochladen
        $document = $this->uploadCertificateToDocuments($employee, $pdfPath, $request->all());
        
        return redirect()->back()->with([
            'success' => 'Bescheinigung erfolgreich erstellt',
            'download_url' => Storage::disk('public')->url($document->file_path)
        ]);
    }

    /**
     * PDF für Bescheinigung generieren
     */
    private function generateCertificatePDF($employee, $data)
    {
        $workDate = Carbon::parse($data['work_date']);
        $certificateType = $data['certificate_type'];
        $workHours = $data['work_hours'] ?? 8;
        $description = $data['description'] ?? '';
        $customText = $data['custom_text'] ?? '';

        // Ordnerstruktur: mitarbeiter/Vorname_Nachname_geburtsdatum/
        $folder = "mitarbeiter/" . Str::slug("{$employee->first_name}_{$employee->last_name}_{$employee->birth_date}");
        
        // Eindeutigen Dateinamen erstellen
        $filename = "bescheinigung_" . $workDate->format('Y-m-d') . "_" . time() . ".txt";
        $filePath = $folder . "/" . $filename;

        // PDF-Inhalt generieren
        $pdfContent = $this->generatePDFContent($employee, $workDate, $certificateType, $workHours, $description, $customText);
        
        // PDF im Storage speichern
        Storage::disk('public')->put($filePath, $pdfContent);

        return $filePath;
    }

    /**
     * PDF-Inhalt generieren (einfache Text-basierte PDF)
     */
    private function generatePDFContent($employee, $workDate, $certificateType, $workHours, $description, $customText)
    {
        // Einfache PDF-Generierung ohne externe Bibliothek
        $content = $this->generateSimplePDF($employee, $workDate, $certificateType, $workHours, $description, $customText);
        
        return $content;
    }

    /**
     * Einfache PDF-Generierung ohne externe Bibliothek
     */
    private function generateSimplePDF($employee, $workDate, $certificateType, $workHours, $description, $customText)
    {
        $workTypeText = '';
        switch($certificateType) {
            case 'work_confirmation':
                $workTypeText = "in unserem Unternehmen gearbeitet hat.\nArbeitszeit: {$workHours} Stunden";
                break;
            case 'attendance':
                $workTypeText = "anwesend war.";
                break;
            default:
                $workTypeText = "die angegebene Tätigkeit ausgeführt hat.";
        }

        $descriptionText = $description ? "\n\nBeschreibung: {$description}" : '';
        $customTextContent = $customText ? "\n\nZusätzliche Angaben: {$customText}" : '';

        $pdfContent = "BESCHEINIGUNG\n\n";
        $pdfContent .= "Gali Floor Industriebodentechnik\n";
        $pdfContent .= "Josefstraße 1, 59067 Hamm\n";
        $pdfContent .= "Telefon: 02381 / 27 95 644 | Handy: 0176 624 98101\n\n";
        $pdfContent .= str_repeat("=", 50) . "\n\n";
        
        $pdfContent .= "Bescheinigt wird hiermit, dass\n\n";
        $pdfContent .= "Name: {$employee->first_name} {$employee->last_name}\n";
        $pdfContent .= "Geburtsdatum: {$employee->birth_date}\n";
        $pdfContent .= "Anschrift: " . ($employee->address ?? 'Nicht angegeben') . "\n\n";
        
        $pdfContent .= "am {$workDate->format('d.m.Y')} {$workTypeText}";
        $pdfContent .= $descriptionText;
        $pdfContent .= $customTextContent;
        
        $pdfContent .= "\n\n" . str_repeat("=", 50) . "\n\n";
        $pdfContent .= "Hamm, " . Carbon::now()->format('d.m.Y') . "\n\n";
        $pdfContent .= "Gali Floor Industriebodentechnik\n";
        $pdfContent .= "Stefan Asenov\n";
        $pdfContent .= "Geschäftsführer\n";
        
        return $pdfContent;
    }

    /**
     * HTML-Template für Bescheinigung (für spätere Verwendung)
     */
    private function getCertificateHTML($employee, $workDate, $certificateType, $workHours, $description, $customText)
    {
        $workTypeText = '';
        switch($certificateType) {
            case 'work_confirmation':
                $workTypeText = "in unserem Unternehmen gearbeitet hat.<br>
                                <strong>Arbeitszeit:</strong> {$workHours} Stunden";
                break;
            case 'attendance':
                $workTypeText = "anwesend war.";
                break;
            default:
                $workTypeText = "die angegebene Tätigkeit ausgeführt hat.";
        }

        $descriptionText = $description ? "<br><br><strong>Beschreibung:</strong> {$description}" : '';
        $customTextContent = $customText ? "<br><br><strong>Zusätzliche Angaben:</strong> {$customText}" : '';

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Bescheinigung</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px; 
                    line-height: 1.6;
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 40px;
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 20px;
                }
                .company { 
                    font-size: 20px; 
                    font-weight: bold; 
                    color: #2563eb;
                    margin-bottom: 5px;
                }
                .address { 
                    font-size: 14px; 
                    color: #666; 
                }
                .title { 
                    font-size: 18px; 
                    font-weight: bold; 
                    text-align: center; 
                    margin: 40px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .content { 
                    line-height: 1.8; 
                    font-size: 14px;
                }
                .employee-info {
                    background-color: #f8fafc;
                    padding: 20px;
                    border-left: 4px solid #2563eb;
                    margin: 20px 0;
                }
                .work-details {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f1f5f9;
                    border-radius: 5px;
                }
                .signature { 
                    margin-top: 60px; 
                    text-align: right;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    width: 200px;
                    margin: 40px 0 10px auto;
                }
                .date {
                    margin-bottom: 20px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class='header'>
                <div class='company'>Gali Floor Industriebodentechnik</div>
                <div class='address'>Josefstraße 1, 59067 Hamm</div>
                <div class='address'>Telefon: 02381 / 27 95 644 | Handy: 0176 624 98101</div>
            </div>
            
            <div class='title'>BescHEINIGUNG</div>
            
            <div class='content'>
                <p>Bescheinigt wird hiermit, dass</p>
                
                <div class='employee-info'>
                    <p><strong>Name:</strong> {$employee->first_name} {$employee->last_name}</p>
                    <p><strong>Geburtsdatum:</strong> {$employee->birth_date}</p>
                    <p><strong>Anschrift:</strong> " . ($employee->address ?? 'Nicht angegeben') . "</p>
                </div>
                
                <div class='work-details'>
                    <p>am <strong>{$workDate->format('d.m.Y')}</strong> {$workTypeText}</p>
                    {$descriptionText}
                    {$customTextContent}
                </div>
            </div>
            
            <div class='signature'>
                <div class='date'>Hamm, " . Carbon::now()->format('d.m.Y') . "</div>
                <div class='signature-line'></div>
                <p><strong>Gali Floor Industriebodentechnik</strong></p>
                <p>Stefan Asenov</p>
                <p>Geschäftsführer</p>
            </div>
        </body>
        </html>";
    }

    /**
     * Bescheinigung in Dokumente hochladen
     */
    private function uploadCertificateToDocuments($employee, $filePath, $data)
    {
        $workDate = Carbon::parse($data['work_date']);
        $certificateType = $data['certificate_type'];
        
        // Originalname für das Dokument
        $originalName = "Bescheinigung_" . $workDate->format('Y-m-d') . "_" . 
                       ucfirst(str_replace('_', ' ', $certificateType)) . ".txt";

        // Datenbankeintrag erstellen
        $document = EmployeeDocument::create([
            'employee_id' => $employee->id,
            'original_name' => $originalName,
            'file_path' => $filePath,
        ]);

        return $document;
    }

    /**
     * Verfügbare Bescheinigungstypen abrufen
     */
    public function getCertificateTypes()
    {
        return response()->json([
            'types' => [
                'work_confirmation' => 'Arbeitsbescheinigung',
                'attendance' => 'Anwesenheitsbescheinigung',
                'other' => 'Sonstige Bescheinigung'
            ]
        ]);
    }
}
