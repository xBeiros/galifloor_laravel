<template>
    <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">Bescheinigung erstellen</h3>
        
        <div class="space-y-4">
            <!-- Bescheinigungstyp -->
            <div>
                <label for="certificate_type" class="block text-sm font-medium text-gray-700 mb-2">
                    Art der Bescheinigung
                </label>
                <select
                    id="certificate_type"
                    v-model="form.certificate_type"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                >
                    <option value="">Bitte wählen...</option>
                    <option value="work_confirmation">Arbeitsbescheinigung</option>
                    <option value="attendance">Anwesenheitsbescheinigung</option>
                    <option value="other">Sonstige Bescheinigung</option>
                </select>
            </div>

            <!-- Arbeitsdatum -->
            <div>
                <label for="work_date" class="block text-sm font-medium text-gray-700 mb-2">
                    Datum
                </label>
                <input
                    id="work_date"
                    v-model="form.work_date"
                    type="date"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
            </div>

            <!-- Arbeitsstunden (nur bei Arbeitsbescheinigung) -->
            <div v-if="form.certificate_type === 'work_confirmation'">
                <label for="work_hours" class="block text-sm font-medium text-gray-700 mb-2">
                    Arbeitsstunden
                </label>
                <input
                    id="work_hours"
                    v-model="form.work_hours"
                    type="number"
                    min="1"
                    max="24"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="8"
                />
            </div>

            <!-- Beschreibung -->
            <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung (optional)
                </label>
                <textarea
                    id="description"
                    v-model="form.description"
                    rows="3"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Kurze Beschreibung der Tätigkeit..."
                ></textarea>
            </div>

            <!-- Zusätzlicher Text -->
            <div>
                <label for="custom_text" class="block text-sm font-medium text-gray-700 mb-2">
                    Zusätzliche Angaben (optional)
                </label>
                <textarea
                    id="custom_text"
                    v-model="form.custom_text"
                    rows="3"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Weitere Details oder spezielle Hinweise..."
                ></textarea>
            </div>

            <!-- Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex space-x-2">
                    <button
                        type="button"
                        @click="createCertificate"
                        :disabled="creating"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg v-if="creating" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        {{ creating ? 'Wird erstellt...' : 'PDF erstellen & hochladen' }}
                    </button>
                    
                    <button
                        type="button"
                        @click="createCertificateOnly"
                        :disabled="creating"
                        class="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Nur PDF herunterladen
                    </button>
                </div>
                
                <button
                    type="button"
                    @click="resetForm"
                    :disabled="creating"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Zurücksetzen
                </button>
            </div>
        </div>

        <!-- Erfolgs-/Fehlermeldungen -->
        <div v-if="message" class="mt-4">
            <div v-if="messageType === 'success'" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <div class="flex">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <p class="font-medium">{{ message }}</p>
                        <p v-if="downloadUrl" class="text-sm mt-1">
                            <a :href="downloadUrl" target="_blank" class="underline hover:no-underline">
                                Bescheinigung herunterladen
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <div v-else-if="messageType === 'error'" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div class="flex">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <p class="font-medium">{{ message }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { generateCertificatePDF, generateCertificateAndUpload } from '@/Composables/generateCertificatePDF';

const props = defineProps({
    employeeId: {
        type: [String, Number],
        required: true
    },
    employee: {
        type: Object,
        required: true
    }
});

const creating = ref(false);
const message = ref('');
const messageType = ref('');
const downloadUrl = ref('');

const form = reactive({
    certificate_type: '',
    work_date: '',
    work_hours: 8,
    description: '',
    custom_text: ''
});

const createCertificate = async () => {
    if (!form.certificate_type || !form.work_date) {
        showMessage('Bitte füllen Sie alle Pflichtfelder aus.', 'error');
        return;
    }

    creating.value = true;
    message.value = '';
    downloadUrl.value = '';

    try {
        // PDF-Daten vorbereiten
        const certificateData = {
            employee: {
                first_name: props.employee.first_name,
                last_name: props.employee.last_name,
                birth_date: props.employee.birth_date,
                address: props.employee.address
            },
            work_date: form.work_date,
            certificate_type: form.certificate_type,
            work_hours: form.work_hours,
            description: form.description,
            custom_text: form.custom_text
        };

        // PDF generieren und hochladen
        const result = await generateCertificateAndUpload(certificateData, props.employeeId);

        if (result.success) {
            showMessage('Bescheinigung erfolgreich erstellt und hochgeladen!', 'success');
            downloadUrl.value = result.downloadUrl;
            resetForm();
            // Seite neu laden, um die neue Dokumenten-Liste anzuzeigen
            window.location.reload();
        } else {
            showMessage(result.error || 'Fehler beim Erstellen der Bescheinigung', 'error');
        }
    } catch (error) {
        console.error('Fehler:', error);
        showMessage('Ein unerwarteter Fehler ist aufgetreten', 'error');
    } finally {
        creating.value = false;
    }
};

const createCertificateOnly = () => {
    if (!form.certificate_type || !form.work_date) {
        showMessage('Bitte füllen Sie alle Pflichtfelder aus.', 'error');
        return;
    }

    // PDF-Daten vorbereiten
    const certificateData = {
        employee: {
            first_name: props.employee.first_name,
            last_name: props.employee.last_name,
            birth_date: props.employee.birth_date,
            address: props.employee.address
        },
        work_date: form.work_date,
        certificate_type: form.certificate_type,
        work_hours: form.work_hours,
        description: form.description,
        custom_text: form.custom_text
    };

    // Nur PDF generieren und herunterladen
    generateCertificatePDF(certificateData);
    showMessage('Bescheinigung wurde heruntergeladen!', 'success');
};

const resetForm = () => {
    form.certificate_type = '';
    form.work_date = '';
    form.work_hours = 8;
    form.description = '';
    form.custom_text = '';
    message.value = '';
    downloadUrl.value = '';
};

const showMessage = (text, type) => {
    message.value = text;
    messageType.value = type;
    
    // Nach 10 Sekunden die Nachricht ausblenden
    setTimeout(() => {
        message.value = '';
        messageType.value = '';
        downloadUrl.value = '';
    }, 10000);
};
</script>
