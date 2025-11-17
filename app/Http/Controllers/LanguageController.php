<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    public function switchLanguage(Request $request, $locale)
    {
        if (in_array($locale, ['de', 'tr'])) {
            Session::put('locale', $locale);
        }
        
        return redirect()->back();
    }
}
