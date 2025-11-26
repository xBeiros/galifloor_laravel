<script setup lang="ts">
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Field, Form as VeeForm, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import { generateIvehaInvoicePDF } from '@/Composables/generateIvehaInvoicePDF';
import { router, usePage } from '@inertiajs/vue3';
import dayjs from 'dayjs';

const { t } = useI18n();
const page = usePage();

interface IvehaInvoice {
    id: number;
    invoice_date: string;
    invoice_number: string;
    project_number: string;
    construction_address: string;
    description: string;
    qm: number;
    persons: number;
    hours: number;
    calendar_week: string;
    execution_day: string;
    total_price: number;
    total_sum: number;
    skonto: number;
    invoice_amount: number;
    created_at: string;
}

const props = defineProps<{
    invoices?: IvehaInvoice[];
    totalAmount?: number;
}>();

// Suchfunktion
const searchQuery = ref('');

// Gefilterte und sortierte Rechnungen
const filteredInvoices = computed(() => {
    if (!props.invoices) return [];
    
    let filtered = [...props.invoices];
    
    // Suche anwenden
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(invoice => 
            invoice.invoice_number.toLowerCase().includes(query) ||
            invoice.project_number.toLowerCase().includes(query) ||
            invoice.construction_address.toLowerCase().includes(query) ||
            invoice.description.toLowerCase().includes(query)
        );
    }
    
    // Sortierung nach Rechnungsnummer (aufsteigend)
    filtered.sort((a, b) => {
        // Extrahiere die Nummer aus der Rechnungsnummer (z.B. "148" aus "148" oder "RG2024-148")
        const numA = parseInt(a.invoice_number.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.invoice_number.replace(/\D/g, '')) || 0;
        return numA - numB;
    });
    
    return filtered;
});

// Gesamtbetrag der gefilterten Rechnungen
const filteredTotalAmount = computed(() => {
    return filteredInvoices.value.reduce((sum, invoice) => sum + parseFloat(invoice.invoice_amount.toString()), 0);
});

const formData = ref({
    invoice_date: '',
    invoice_number: '',
    project_number: '',
    construction_address: '',
    description: '',
    qm: '',
    persons: '',
    hours: '',
    calendar_week: '',
    execution_day: ''
});

const validationSchema = yup.object({
    invoice_date: yup.string().required('Datum ist erforderlich'),
    invoice_number: yup.string().required('Rechnungsnummer ist erforderlich'),
    project_number: yup.string().required('Projektnummer ist erforderlich'),
    construction_address: yup.string().required('Bauvorhaben Adresse ist erforderlich'),
    description: yup.string().required('Bezeichnung ist erforderlich'),
    qm: yup.number().required('Quadratmeter ist erforderlich').min(0, 'Quadratmeter muss positiv sein'),
    persons: yup.number().required('Personenanzahl ist erforderlich').min(1, 'Personenanzahl muss mindestens 1 sein'),
    hours: yup.number().required('Stunden ist erforderlich').min(0, 'Stunden muss positiv sein'),
    calendar_week: yup.string().required('Kalenderwoche ist erforderlich'),
    execution_day: yup.string().required('Tag der Ausführung ist erforderlich')
});

// Automatische Berechnungen
const totalPrice = computed(() => {
    const hours = parseFloat(formData.value.hours) || 0;
    const price = hours * 45;
    return price.toFixed(2);
});

const totalSum = computed(() => {
    const price = parseFloat(totalPrice.value) || 0;
    return price;
});

const skonto = computed(() => {
    const sum = totalSum.value;
    const skontoValue = sum * 0.03;
    return skontoValue.toFixed(2);
});

const invoiceAmount = computed(() => {
    const sum = totalSum.value;
    const skontoValue = parseFloat(skonto.value) || 0;
    const amount = sum - skontoValue;
    return amount.toFixed(2);
});

// Vorlage für Bezeichnung generieren
const generateDescriptionTemplate = () => {
    const qm = formData.value.qm || '';
    const persons = formData.value.persons || '';
    if (!qm && !persons) {
        return '';
    }
    const personsText = persons ? `${persons} Person${persons !== '1' ? 'en' : ''}` : '';
    const qmText = qm ? `${qm} qm` : '';
    if (qmText && personsText) {
        return `Bauhilfe für ${qmText} - ${personsText}`;
    } else if (qmText) {
        return `Bauhilfe für ${qmText}`;
    } else if (personsText) {
        return `Bauhilfe - ${personsText}`;
    }
    return '';
};

// Bezeichnung aktualisieren wenn qm oder Personenanzahl geändert wird
const lastManualDescription = ref('');
const isManualEdit = ref(false);

const updateDescriptionFromTemplate = () => {
    // Nur aktualisieren, wenn die Bezeichnung noch nicht manuell geändert wurde
    if (!isManualEdit.value) {
        formData.value.description = generateDescriptionTemplate();
    }
};

// Bezeichnung manuell geändert - merken
watch(() => formData.value.description, (newVal) => {
    const template = generateDescriptionTemplate();
    if (newVal && newVal !== template) {
        isManualEdit.value = true;
        lastManualDescription.value = newVal;
    } else if (newVal === template) {
        isManualEdit.value = false;
    }
});

// Initialisiere Bezeichnung beim ersten Laden
watch([() => formData.value.qm, () => formData.value.persons], () => {
    if (!isManualEdit.value && (formData.value.qm || formData.value.persons)) {
        updateDescriptionFromTemplate();
    }
});

const onSubmit = async (values: any) => {
    const invoiceData = {
        ...values,
        total_price: parseFloat(totalPrice.value),
        total_sum: totalSum.value,
        skonto: parseFloat(skonto.value),
        invoice_amount: parseFloat(invoiceAmount.value)
    };
    
    await generateIvehaInvoicePDF(invoiceData);
};

const handleDownload = async () => {
    // Validierung vor dem Speichern
    if (!formData.value.invoice_date || !formData.value.invoice_number || 
        !formData.value.project_number || !formData.value.construction_address ||
        !formData.value.description || !formData.value.qm || !formData.value.persons || !formData.value.hours ||
        !formData.value.calendar_week || !formData.value.execution_day) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }
    
    const invoiceData = {
        ...formData.value,
        total_price: parseFloat(totalPrice.value),
        total_sum: totalSum.value,
        skonto: parseFloat(skonto.value),
        invoice_amount: parseFloat(invoiceAmount.value)
    };
    
    // Rechnung in Datenbank speichern (ohne PDF-Download)
    router.post('/iveha-invoices', invoiceData, {
        onSuccess: () => {
            // Notification anzeigen
            notificationMessage.value = 'Rechnung erfolgreich ausgestellt.';
            showNotification.value = true;
            setTimeout(() => {
                showNotification.value = false;
                notificationMessage.value = '';
            }, 5000);
            // Die Liste wird automatisch aktualisiert
        },
        onError: (errors) => {
            console.error('Fehler beim Speichern der Rechnung:', errors);
            notificationMessage.value = 'Fehler beim Speichern der Rechnung.';
            showNotification.value = true;
            setTimeout(() => {
                showNotification.value = false;
                notificationMessage.value = '';
            }, 5000);
        }
    });
};

// Rechnung erneut herunterladen
const handleDownloadInvoice = async (invoice: IvehaInvoice) => {
    const invoiceData = {
        invoice_date: invoice.invoice_date,
        invoice_number: invoice.invoice_number,
        project_number: invoice.project_number,
        construction_address: invoice.construction_address,
        description: invoice.description,
        qm: invoice.qm.toString(),
        persons: invoice.persons.toString(),
        hours: invoice.hours.toString(),
        calendar_week: invoice.calendar_week,
        execution_day: invoice.execution_day,
        total_price: invoice.total_price,
        total_sum: invoice.total_sum,
        skonto: invoice.skonto,
        invoice_amount: invoice.invoice_amount
    };
    
    // PDF generieren und herunterladen (inkl. Quittung)
    await generateIvehaInvoicePDF(invoiceData);
};

// Rechnung löschen
const handleDeleteInvoice = (id: number) => {
    if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
        router.delete(route('iveha-invoices.destroy', id.toString()), {
            onSuccess: () => {
                // Seite wird automatisch neu geladen
            }
        });
    }
};

// Notification für Erfolgsmeldungen
const successMessage = computed(() => {
    const flash = page.props.flash as { success?: string } | undefined;
    return flash?.success || '';
});
const showNotification = ref(false);
const notificationMessage = ref('');

// Watch für Success-Message vom Backend
watch(successMessage, (newVal) => {
    if (newVal) {
        notificationMessage.value = newVal;
        showNotification.value = true;
        setTimeout(() => {
            showNotification.value = false;
            notificationMessage.value = '';
        }, 5000);
    }
}, { immediate: true });
</script>

<template>
    <Head :title="t('iveha_invoices.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                {{ t('iveha_invoices.title') }}
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <!-- Notification -->
                <div v-if="showNotification" class="mb-6">
                    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            <p class="font-medium">{{ notificationMessage }}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Formular für neue Rechnung -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 text-gray-900 dark:text-gray-100">
                        <h3 class="text-lg font-semibold mb-6">{{ t('iveha_invoices.description') }}</h3>
                        
                        <VeeForm 
                            :validation-schema="validationSchema" 
                            v-slot="{ handleSubmit: veeHandleSubmit, isSubmitting }"
                        >
                            <form @submit.prevent="veeHandleSubmit(onSubmit)" class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Datum -->
                                    <div>
                                        <label for="invoice_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.invoice_date') }}
                                        </label>
                                        <Field
                                            id="invoice_date"
                                            name="invoice_date"
                                            type="date"
                                            v-model="formData.invoice_date"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="invoice_date" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Rechnungsnummer -->
                                    <div>
                                        <label for="invoice_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.invoice_number') }}
                                        </label>
                                        <Field
                                            id="invoice_number"
                                            name="invoice_number"
                                            type="text"
                                            v-model="formData.invoice_number"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="invoice_number" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Projektnummer -->
                                    <div>
                                        <label for="project_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.project_number') }}
                                        </label>
                                        <Field
                                            id="project_number"
                                            name="project_number"
                                            type="text"
                                            v-model="formData.project_number"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="project_number" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Bauvorhaben Adresse -->
                                    <div>
                                        <label for="construction_address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.construction_address') }}
                                        </label>
                                        <Field
                                            id="construction_address"
                                            name="construction_address"
                                            type="text"
                                            v-model="formData.construction_address"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="construction_address" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Bezeichnung -->
                                    <div class="md:col-span-2">
                                        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.description') }}
                                        </label>
                                        <Field
                                            id="description"
                                            name="description"
                                            type="text"
                                            v-model="formData.description"
                                            :placeholder="generateDescriptionTemplate()"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="description" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {{ t('iveha_invoices.form.description_hint') }}
                                        </p>
                                    </div>

                                    <!-- Quadratmeter -->
                                    <div>
                                        <label for="qm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.qm') }}
                                        </label>
                                        <Field
                                            id="qm"
                                            name="qm"
                                            type="number"
                                            step="0.01"
                                            v-model="formData.qm"
                                            @input="updateDescriptionFromTemplate"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="qm" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Personenanzahl -->
                                    <div>
                                        <label for="persons" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.persons') }}
                                        </label>
                                        <Field
                                            id="persons"
                                            name="persons"
                                            type="number"
                                            step="1"
                                            min="1"
                                            v-model="formData.persons"
                                            @input="updateDescriptionFromTemplate"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="persons" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Stunden -->
                                    <div>
                                        <label for="hours" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.hours') }}
                                        </label>
                                        <Field
                                            id="hours"
                                            name="hours"
                                            type="number"
                                            step="0.01"
                                            v-model="formData.hours"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="hours" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>

                                    <!-- Kalenderwoche -->
                                    <div>
                                        <label for="calendar_week" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.calendar_week') }}
                                        </label>
                                        <Field
                                            id="calendar_week"
                                            name="calendar_week"
                                            type="text"
                                            v-model="formData.calendar_week"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="calendar_week" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>


                                    <!-- Tag der Ausführung -->
                                    <div>
                                        <label for="execution_day" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {{ t('iveha_invoices.form.day') }}
                                        </label>
                                        <Field
                                            id="execution_day"
                                            name="execution_day"
                                            type="text"
                                            v-model="formData.execution_day"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <ErrorMessage name="execution_day" class="mt-1 text-sm text-red-600 dark:text-red-400" />
                                    </div>
                                </div>


                                <!-- Berechnungen -->
                                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {{ t('iveha_invoices.form.total_price') }}
                                        </span>
                                        <span class="text-sm text-gray-900 dark:text-white">
                                            {{ totalPrice }} € <span class="text-xs text-gray-500">({{ t('iveha_invoices.auto_calculated') }})</span>
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {{ t('iveha_invoices.form.total_sum') }}
                                        </span>
                                        <span class="text-sm text-gray-900 dark:text-white">
                                            {{ totalSum.toFixed(2) }} €
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {{ t('iveha_invoices.form.skonto') }}
                                        </span>
                                        <span class="text-sm text-gray-900 dark:text-white">
                                            -{{ skonto }} € <span class="text-xs text-gray-500">({{ t('iveha_invoices.auto_calculated') }})</span>
                                        </span>
                                    </div>
                                    <div class="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                                            {{ t('iveha_invoices.form.invoice_amount') }}
                                        </span>
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white">
                                            {{ invoiceAmount }} €
                                        </span>
                                    </div>
                                </div>

                                <!-- Download Button -->
                                <div class="flex justify-end">
                                    <button
                                        type="button"
                                        @click="handleDownload"
                                        class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        {{ t('iveha_invoices.form.download') }}
                                    </button>
                                </div>
                            </form>
                        </VeeForm>
                    </div>
                </div>
                
                <!-- Übersicht der Rechnungen -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mt-6">
                    <div class="p-6 text-gray-900 dark:text-gray-100">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Ausgestellte Iveha Rechnungen</h3>
                            <div class="w-64">
                                <input
                                    v-model="searchQuery"
                                    type="text"
                                    placeholder="Suchen (RG-Nr., Projekt, Bauvorhaben...)"
                                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                        
                        <!-- Tabelle mit Rechnungen -->
                        <div class="overflow-x-hidden">
                            <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style="width: 10%;">Datum</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style="width: 12%;">Rechnungsnummer</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style="width: 12%;">Projektnummer</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style="width: 35%;">Bauvorhaben</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style="width: 15%;">Rechnungsbetrag</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style="width: 10%;">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr v-if="filteredInvoices.length === 0">
                                        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                            <span v-if="searchQuery.trim()">Keine Rechnungen gefunden</span>
                                            <span v-else>Noch keine Rechnungen erstellt</span>
                                        </td>
                                    </tr>
                                    <tr v-for="invoice in filteredInvoices" :key="invoice.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {{ dayjs(invoice.invoice_date).format('DD.MM.YYYY') }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {{ invoice.invoice_number }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {{ invoice.project_number }}
                                        </td>
                                        <td class="px-6 py-4 text-sm text-gray-900 dark:text-white break-words">
                                            {{ invoice.construction_address }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {{ Number(invoice.invoice_amount).toFixed(2) }} €
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div class="flex space-x-2">
                                                <button
                                                    @click="handleDownloadInvoice(invoice)"
                                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    title="Rechnung und Quittung herunterladen"
                                                >
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    @click="handleDeleteInvoice(invoice.id)"
                                                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Rechnung löschen"
                                                >
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot v-if="filteredInvoices.length > 0" class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <td colspan="4" class="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                            <span v-if="searchQuery.trim()">Gesamtbetrag (gefiltert):</span>
                                            <span v-else>Gesamtbetrag:</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                            {{ filteredTotalAmount.toFixed(2) }} €
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

