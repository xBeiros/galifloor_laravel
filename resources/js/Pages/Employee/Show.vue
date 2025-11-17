<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import { defineProps, ref, computed } from 'vue';
import EmployeeDocumentUploader from '@/Components/EmployeeDocumentUploader.vue';
import CertificateGenerator from '@/Components/CertificateGenerator.vue';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, UserIcon, CalendarIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, BanknotesIcon, ClockIcon, PencilIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    employee: Object
});

// Reaktive Kopie der Mitarbeiter-Daten für lokale Updates
const employeeData = ref({ ...props.employee });

// State für aufklappbare Sektionen
const showCertificateGenerator = ref(false);
const showDocumentUploader = ref(false);
const showEmployeeInfo = ref(true);
const showDocuments = ref(true);

// Modal States
const showCertificateModal = ref(false);
const showDocumentModal = ref(false);
const showEditModal = ref(false);

// Dokumenten-Kategorien Kollaps-Status
const documentCategoryStates = ref({});

// Bearbeitungsformular
const editForm = useForm({
    first_name: props.employee.first_name || '',
    last_name: props.employee.last_name || '',
    email: props.employee.email || '',
    phone: props.employee.phone || '',
    birth_date: props.employee.birth_date || '',
    birth_place: props.employee.birth_place || '',
    address: props.employee.address || '',
    postal: props.employee.postal || '',
    city: props.employee.city || '',
    nationality: props.employee.nationality || '',
    gender: props.employee.gender || '',
    bank_name: props.employee.bank_name || '',
    iban: props.employee.iban || '',
    social_security_number: props.employee.social_security_number || '',
    health_insurance: props.employee.health_insurance || '',
    employment_start: props.employee.employment_start || '',
    weekly_hours: props.employee.weekly_hours || '',
    hourly_wage: props.employee.hourly_wage || '',
    status: props.employee.status || 'active',
    image: null
});

const updateEmployee = () => {
    console.log('Updating employee with form data:', editForm.data());
    
    // Erstelle FormData für File-Upload
    const formData = new FormData();
    
    // Alle Formular-Daten hinzufügen
    Object.keys(editForm.data()).forEach(key => {
        if (editForm.data()[key] !== null && editForm.data()[key] !== undefined) {
            formData.append(key, editForm.data()[key]);
        }
    });
    
    // CSRF Token hinzufügen
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        formData.append('_token', csrfToken);
    }
    
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }
    
    // Sende als POST mit _method PUT
    formData.append('_method', 'PUT');
    
    fetch(`/employee/${props.employee.id}`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Update response:', data);
        showEditModal.value = false;
        
        // Mitarbeiter-Daten aktualisieren
        if (data.success && data.employee) {
            // Aktualisiere die lokalen Daten
            Object.assign(employeeData.value, data.employee);
            console.log('Employee data updated:', employeeData.value);
            
            // Zeige Erfolgsmeldung
            alert('Mitarbeiter erfolgreich aktualisiert!');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
    });
};

// Dokumenten-Kategorien Kollaps-Funktionen
const toggleDocumentCategory = (category) => {
    documentCategoryStates.value[category] = !documentCategoryStates.value[category];
};

const isDocumentCategoryExpanded = (category) => {
    return documentCategoryStates.value[category] || false;
};

// Profilbild-Funktionen
const getImageSrc = () => {
    const employee = employeeData.value;
    console.log('=== getImageSrc() Debug ===');
    console.log('Employee data:', employee);
    console.log('image_url:', employee.image_url);
    console.log('image_path:', employee.image_path);
    console.log('Has image_url:', !!employee.image_url);
    console.log('Has image_path:', !!employee.image_path);
    
    if (employee.image_url) {
        console.log('✅ Using image_url:', employee.image_url);
        return employee.image_url;
    }
    
    if (employee.image_path) {
        console.log('✅ Using image_path:', employee.image_path);
        // Stelle sicher, dass der Pfad korrekt ist
        if (employee.image_path.startsWith('storage/')) {
            return '/' + employee.image_path;
        } else if (employee.image_path.startsWith('/storage/')) {
            return employee.image_path;
        } else {
            return '/storage/' + employee.image_path;
        }
    }
    
    console.log('❌ Using default image - no image found');
    return '/images/default-user.svg';
};

const handleImageError = (event) => {
    console.error('Image load error:', event);
    event.target.src = '/images/default-user.svg';
};

// Dokumenten-Kategorien
const documentCategories = computed(() => {
    if (!employeeData.value?.documents || !Array.isArray(employeeData.value.documents)) {
        return {
            'Bescheinigungen': [],
            'Lohnbescheide': [],
            'Mitarbeiter-Dokumente': [],
            'Sonstige': []
        };
    }
    
    const categories = {
        'Bescheinigungen': [],
        'Lohnbescheide': [],
        'Mitarbeiter-Dokumente': [],
        'Sonstige': []
    };
    
    employeeData.value.documents.forEach(doc => {
        if (!doc || !doc.original_name) return;
        
        const name = doc.original_name.toLowerCase();
        if (name.includes('bescheinigung') || name.includes('certificate')) {
            categories['Bescheinigungen'].push(doc);
        } else if (name.includes('lohn') || name.includes('gehalt') || name.includes('salary')) {
            categories['Lohnbescheide'].push(doc);
        } else if (name.includes('vertrag') || name.includes('contract') || name.includes('ausweis') || name.includes('id')) {
            categories['Mitarbeiter-Dokumente'].push(doc);
        } else {
            categories['Sonstige'].push(doc);
        }
    });
    
    return categories;
});

const deleteDocument = (documentId) => {
    if (confirm('Möchtest du dieses Dokument wirklich löschen?')) {
        const form = useForm({});
        
        form.delete(`/employee/document/${documentId}`, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Dokument gelöscht:', documentId);
            },
            onError: (errors) => {
                console.error('Fehler beim Löschen:', errors);
            }
        });
    }
};

const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
        case 'pdf':
            return '📄';
        case 'doc':
        case 'docx':
            return '📝';
        case 'jpg':
        case 'jpeg':
        case 'png':
            return '🖼️';
        default:
            return '📎';
    }
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const getStatusColor = (status) => {
    switch(status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'terminated':
            return 'bg-red-100 text-red-800';
        case 'on_leave':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusText = (status) => {
    switch(status) {
        case 'active':
            return t('employee.show.status_map.active');
        case 'terminated':
            return t('employee.show.status_map.terminated');
        case 'on_leave':
            return t('employee.show.status_map.on_leave');
        default:
            return status;
    }
};
</script>

<template>
    <Head :title="`${employeeData.first_name} ${employeeData.last_name}`" />
    <AuthenticatedLayout>
        <template #header>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {{ employeeData.first_name }} {{ employeeData.last_name }}
                </h2>
                <span :class="['px-3 py-1 rounded-full text-xs sm:text-sm font-medium', getStatusColor(employeeData.status)]">
                    {{ getStatusText(employeeData.status) }}
                </span>
            </div>
        </template>

        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Header Card -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg mb-6">
                <div class="p-4 sm:p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div class="flex items-center space-x-4 sm:space-x-6">
                            <div class="relative flex-shrink-0">
                                <img :src="getImageSrc()" 
                                     alt="Profilbild" 
                                     class="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-lg" 
                                     @error="handleImageError" />
                                <div class="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                    <UserIcon class="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ employeeData.first_name }} {{ employeeData.last_name }}</h1>
                                <p class="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">{{ employeeData.email || t('employee.show.no_email') }}</p>
                                <div class="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                    <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        <CalendarIcon class="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                        {{ formatDate(employeeData.birth_date) }}
                                    </span>
                                    <span v-if="employeeData.phone" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        <PhoneIcon class="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                        {{ employeeData.phone }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Aktionen rechts -->
                        <div class="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-3">
                            <button @click="showEditModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                                <PencilIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span class="hidden sm:inline">{{ t('employee.show.edit') }}</span>
                                <span class="sm:hidden">{{ t('employee.show.edit') }}</span>
                            </button>
                            <button @click="showCertificateModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <DocumentIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span class="hidden sm:inline">{{ t('employee.show.create_certificate') }}</span>
                                <span class="sm:hidden">{{ t('employee.show.create_certificate') }}</span>
                            </button>
                            <button @click="showDocumentModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <FolderIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span class="hidden sm:inline">{{ t('employee.show.upload_document') }}</span>
                                <span class="sm:hidden">{{ t('employee.show.upload_document') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Linke Spalte - Mitarbeiter-Informationen (schmaler) -->
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900 rounded-lg">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <button @click="showEmployeeInfo = !showEmployeeInfo" 
                                    class="flex items-center justify-between w-full text-left">
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ t('employee.show.employee_info') }}</h3>
                                <ChevronDownIcon v-if="showEmployeeInfo" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                                <ChevronRightIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div v-if="showEmployeeInfo" class="p-4 sm:p-6">
                            <div class="space-y-6">
                                <!-- Persönliche Daten -->
                                <div class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <UserIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('employee.show.personal_data') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('employee.show.first_name') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ employee.first_name }}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.last_name') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ employee.last_name }}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.birth_date') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center">
                                                <CalendarIcon class="w-3 h-3 mr-1 text-gray-400" />
                                                {{ formatDate(employee.birth_date) }}
                                            </p>
                                        </div>
                                        <div v-if="employee.birth_place">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.birth_place') }}</label>
                                            <p class="text-sm text-gray-900 font-medium">{{ employee.birth_place }}</p>
                                        </div>
                                        <div v-if="employee.gender">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.gender') }}</label>
                                            <p class="text-sm text-gray-900 font-medium">{{ employee.gender === 'm' ? t('employee.show.gender_male') : t('employee.show.gender_female') }}</p>
                                        </div>
                                        <div v-if="employee.nationality">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.nationality') }}</label>
                                            <p class="text-sm text-gray-900 font-medium">{{ employee.nationality }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Adressdaten -->
                                <div v-if="employee.address || employee.postal || employee.city" class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <MapPinIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('employee.show.address') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div v-if="employee.address">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.street') }}</label>
                                            <p class="text-sm text-gray-900 font-medium">{{ employee.address }}</p>
                                        </div>
                                        <div v-if="employee.postal || employee.city" class="flex space-x-2">
                                            <div v-if="employee.postal" class="flex-1">
                                                <label class="text-xs font-medium text-gray-500">{{ t('employee.show.postal') }}</label>
                                                <p class="text-sm text-gray-900 font-medium">{{ employee.postal }}</p>
                                            </div>
                                            <div v-if="employee.city" class="flex-2">
                                                <label class="text-xs font-medium text-gray-500">{{ t('employee.show.city') }}</label>
                                                <p class="text-sm text-gray-900 font-medium">{{ employee.city }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Kontaktdaten -->
                                <div class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <PhoneIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('employee.show.contact') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div v-if="employee.phone">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.phone') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center">
                                                <PhoneIcon class="w-3 h-3 mr-1 text-gray-400" />
                                                {{ employee.phone }}
                                            </p>
                                        </div>
                                        <div v-if="employee.email">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.email') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center">
                                                <EnvelopeIcon class="w-3 h-3 mr-1 text-gray-400" />
                                                {{ employee.email }}
                                            </p>
                                        </div>
                                        <div v-if="!employee.phone && !employee.email" class="text-xs text-gray-500 italic">
                                            {{ t('employee.show.no_contact') }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Arbeitsdaten -->
                                <div class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <ClockIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('employee.show.work') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div v-if="employee.employment_start">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.entry') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center">
                                                <CalendarIcon class="w-3 h-3 mr-1 text-gray-400" />
                                                {{ formatDate(employee.employment_start) }}
                                            </p>
                                        </div>
                                        <div v-if="employee.weekly_hours">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.weekly_hours') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center">
                                                <ClockIcon class="w-3 h-3 mr-1 text-gray-400" />
                                                {{ employee.weekly_hours }}h
                                            </p>
                                        </div>
                                        <div v-if="employee.hourly_wage">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.hourly_wage') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center">
                                                <BanknotesIcon class="w-3 h-3 mr-1 text-gray-400" />
                                                {{ employee.hourly_wage }}€
                                            </p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.status') }}</label>
                                            <span :class="['inline-flex px-2 py-1 text-xs font-medium rounded-full', getStatusColor(employee.status)]">
                                                {{ getStatusText(employee.status) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Bankdaten -->
                                <div v-if="employee.bank_name || employee.iban" class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <BanknotesIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('employee.show.bank') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div v-if="employee.bank_name">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.bank') }}</label>
                                            <p class="text-sm text-gray-900 font-medium">{{ employee.bank_name }}</p>
                                        </div>
                                        <div v-if="employee.iban">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.iban') }}</label>
                                            <p class="text-xs text-gray-900 dark:text-white font-medium font-mono break-all">{{ employee.iban }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Versicherungsdaten -->
                                <div v-if="employee.social_security_number || employee.health_insurance" class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <DocumentIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('employee.show.insurance') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div v-if="employee.social_security_number">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.social_security') }}</label>
                                            <p class="text-xs text-gray-900 font-medium font-mono break-all">{{ employee.social_security_number }}</p>
                                        </div>
                                        <div v-if="employee.health_insurance">
                                            <label class="text-xs font-medium text-gray-500">{{ t('employee.show.health_insurance') }}</label>
                                            <p class="text-sm text-gray-900 font-medium">{{ employee.health_insurance }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rechte Spalte - Dokumente (breiter) -->
                <div class="lg:col-span-2">
                    <!-- Dokumenten-Liste -->
                    <div class="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900 rounded-lg">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <button @click="showDocuments = !showDocuments" 
                                    class="flex items-center justify-between w-full text-left">
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ t('employee.show.documents') }}</h3>
                                <ChevronDownIcon v-if="showDocuments" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                                <ChevronRightIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div v-if="showDocuments" class="p-4 sm:p-6">
                            <div v-if="employeeData.documents && employeeData.documents.length > 0" class="space-y-4">
                                <div v-for="(docs, category) in documentCategories" :key="category" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                        <button @click="toggleDocumentCategory(category)"
                                                class="w-full flex items-center justify-between text-left hover:bg-gray-100 rounded-md p-1 -m-1 transition-colors">
                                            <div class="flex items-center">
                                                <FolderIcon class="w-5 h-5 text-gray-400 mr-2" />
                                                <h4 class="text-sm sm:text-md font-semibold text-gray-700 dark:text-gray-300">{{ category }}</h4>
                                                <span class="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                                                    {{ docs.length }}
                                                </span>
                                            </div>
                                            <div class="flex items-center">
                                                <ChevronRightIcon v-if="!isDocumentCategoryExpanded(category)" 
                                                                 class="w-4 h-4 text-gray-400 dark:text-gray-500 transform transition-transform" />
                                                <ChevronDownIcon v-else 
                                                                class="w-4 h-4 text-gray-400 dark:text-gray-500 transform transition-transform" />
                                            </div>
                                        </button>
                                    </div>
                                    <div v-if="isDocumentCategoryExpanded(category)" class="p-4">
                                        <div class="space-y-2">
                                            <div v-for="doc in docs" :key="doc.id" 
                                                 class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <div class="flex items-center space-x-3">
                                                    <span class="text-lg">{{ getFileIcon(doc.original_name) }}</span>
                                                    <div class="min-w-0 flex-1">
                                                        <a :href="`/storage/${doc.file_path}`" 
                                                           class="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 block truncate" 
                                                           target="_blank">
                            {{ doc.original_name }}
                        </a>
                                                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(doc.created_at) }}</p>
                                                    </div>
                                                </div>
                                                <button @click="deleteDocument(doc.id)"
                                                        class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                        title="Dokument löschen">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-center py-12">
                                <DocumentIcon class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p class="text-gray-500 dark:text-gray-400">{{ t('employee.show.no_documents') }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Bescheinigung erstellen Modal -->
        <div v-if="showCertificateModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showCertificateModal = false"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl dark:shadow-gray-900 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                                Bescheinigung erstellen
                            </h3>
                            <button @click="showCertificateModal = false" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="mt-2">
                            <CertificateGenerator :employee-id="employee.id" :employee="employee" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dokument hochladen Modal -->
        <div v-if="showDocumentModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showDocumentModal = false"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl dark:shadow-gray-900 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                                Dokument hochladen
                            </h3>
                            <button @click="showDocumentModal = false" class="text-gray-400 hover:text-gray-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="mt-2">
                            <EmployeeDocumentUploader :employee-id="employee.id" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mitarbeiter bearbeiten Modal -->
        <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" aria-hidden="true" @click="showEditModal = false"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl dark:shadow-gray-900 transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                    <form @submit.prevent="updateEmployee" enctype="multipart/form-data" class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg sm:text-xl font-medium text-gray-900 dark:text-white" id="modal-title">
                                Mitarbeiter bearbeiten
                            </h3>
                            <button type="button" @click="showEditModal = false" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <!-- Persönliche Daten -->
                            <div class="space-y-4">
                                <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Persönliche Daten</h4>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Vorname *</label>
                                        <input v-model="editForm.first_name" type="text" required
                                               class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nachname *</label>
                                        <input v-model="editForm.last_name" type="text" required
                                               class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Geburtsdatum *</label>
                                    <input v-model="editForm.birth_date" type="date" required
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Geburtsort</label>
                                    <input v-model="editForm.birth_place" type="text"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Geschlecht</label>
                                        <select v-model="editForm.gender"
                                                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                            <option value="">Bitte wählen</option>
                                            <option value="m">Männlich</option>
                                            <option value="w">Weiblich</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nationalität</label>
                                        <input v-model="editForm.nationality" type="text"
                                               class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                    </div>
                                </div>
                            </div>

                            <!-- Kontaktdaten -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Kontaktdaten</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail</label>
                                    <input v-model="editForm.email" type="email"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                                    <input v-model="editForm.phone" type="tel"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
                                    <input v-model="editForm.address" type="text"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">PLZ</label>
                                        <input v-model="editForm.postal" type="text"
                                               class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Stadt</label>
                                        <input v-model="editForm.city" type="text"
                                               class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                    </div>
                                </div>
                            </div>

                            <!-- Arbeitsdaten -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Arbeitsdaten</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Eintrittsdatum</label>
                                    <input v-model="editForm.employment_start" type="date"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Wochenstunden</label>
                                    <input v-model="editForm.weekly_hours" type="number" min="0" max="60"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Stundenlohn (€)</label>
                                    <input v-model="editForm.hourly_wage" type="number" step="0.01" min="0"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <select v-model="editForm.status"
                                            class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm">
                                        <option value="active">Aktiv</option>
                                        <option value="terminated">Gekündigt</option>
                                        <option value="on_leave">Beurlaubt</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Bankdaten -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Bankdaten</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank</label>
                                    <input v-model="editForm.bank_name" type="text"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">IBAN</label>
                                    <input v-model="editForm.iban" type="text"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono">
                                </div>
                            </div>

                            <!-- Versicherungsdaten -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Versicherungsdaten</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sozialversicherungsnummer</label>
                                    <input v-model="editForm.social_security_number" type="text"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Krankenkasse</label>
                                    <input v-model="editForm.health_insurance" type="text"
                                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                </div>
                            </div>

                            <!-- Profilbild -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Profilbild</h4>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Neues Profilbild</label>
                                    <input @change="editForm.image = $event.target.files[0]" type="file" accept="image/*"
                                           class="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50">
                                </div>
                            </div>
                        </div>

                        <!-- Buttons -->
                        <div class="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                            <button type="button" @click="showEditModal = false"
                                    class="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Abbrechen
                            </button>
                            <button type="submit" :disabled="editForm.processing"
                                    class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                {{ editForm.processing ? 'Speichern...' : 'Speichern' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
