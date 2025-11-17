<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\OwnCompany;

class OwnCompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Prüfe ob bereits Daten vorhanden sind
        if (OwnCompany::count() === 0) {
            OwnCompany::create([
                'name' => 'Gali Floor',
                'address' => 'Josefstr. 1',
                'postal' => '59067',
                'city' => 'Hamm',
                'owner_name' => 'Stefan Asenov Rangelov',
                'represented_by' => 'Demet Güngör',
                'email' => 'galifloor@hotmail.com',
                'email_secondary' => 'info@galifloor.com',
                'tax_identification_number' => 'DE354378859',
            ]);
        } else {
            // Aktualisiere bestehende Einträge
            $ownCompany = OwnCompany::first();
            $updates = [];
            
            if (!$ownCompany->tax_identification_number) {
                $updates['tax_identification_number'] = 'DE354378859';
            }
            if (!$ownCompany->email) {
                $updates['email'] = 'galifloor@hotmail.com';
            }
            if (!$ownCompany->email_secondary) {
                $updates['email_secondary'] = 'info@galifloor.com';
            }
            
            if (!empty($updates)) {
                $ownCompany->update($updates);
            }
        }
    }
}
