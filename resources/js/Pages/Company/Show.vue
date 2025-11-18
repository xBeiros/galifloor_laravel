<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm, router } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import CompanyDocumentUploader from '@/Components/CompanyDocumentUploader.vue';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, PencilIcon, BuildingOfficeIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    company: Object
});

const companyData = ref({ ...props.company });

const showCompanyInfo = ref(true);
const showDocuments = ref(true);
const showDocumentModal = ref(false);
const showEditModal = ref(false);

const editForm = useForm({
    name: props.company.name || '',
    address: props.company.address || '',
    city: props.company.city || '',
    postal: props.company.postal || '',
    email: props.company.email || '',
    security_service: props.company.security_service || 0,
    cash_discount: props.company.cash_discount || 0,
    tax_identification_number: props.company.tax_identification_number || '',
    image: null
});

const updateCompany = () => {
    const formData = new FormData();
    
    Object.keys(editForm.data()).forEach(key => {
        if (editForm.data()[key] !== null && editForm.data()[key] !== undefined) {
            formData.append(key, editForm.data()[key]);
        }
    });
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        formData.append('_token', csrfToken);
    }
    
    formData.append('_method', 'PUT');
    
    fetch(`/company/${props.company.id}`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
        }
    })
    .then(response => response.json())
    .then(data => {
        showEditModal.value = false;
        
        if (data.success && data.company) {
            Object.assign(companyData.value, data.company);
            router.reload();
        }
    })
    .catch(error => {
        console.error('Update error:', error);
    });
};

const getImageSrc = () => {
    const company = companyData.value;
    
    if (company.image_url) {
        if (company.image_url.startsWith('/storage/') || company.image_url.startsWith('storage/')) {
            return company.image_url.startsWith('/') ? company.image_url : '/' + company.image_url;
        }
        return company.image_url;
    }
    
    return '/images/default-user.svg';
};

const handleImageError = (event) => {
    event.target.src = '/images/default-user.svg';
};

const deleteDocument = (documentId) => {
    if (confirm(t('common.confirm_delete_document'))) {
        const form = useForm({});
        
        form.delete(route('company.delete-document', documentId), {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['company'] });
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
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const handleImageUpload = (event) => {
    const target = event.target;
    if (target.files && target.files[0]) {
        editForm.image = target.files[0];
    }
};
</script>

<template>
    <Head :title="companyData.name" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ companyData.name }}
            </h2>
        </template>

        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Header Card -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg mb-6">
                <div class="p-4 sm:p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div class="flex items-center space-x-4 sm:space-x-6">
                            <div class="relative flex-shrink-0">
                                <img :src="getImageSrc()" 
                                     alt="Firmenlogo" 
                                     class="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border-4 border-white dark:border-gray-800 shadow-lg" 
                                     @error="handleImageError" />
                                <div class="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                    <BuildingOfficeIcon class="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ companyData.name }}</h1>
                                <p class="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">{{ companyData.address }}, {{ companyData.postal }} {{ companyData.city }}</p>
                            </div>
                        </div>
                        
                        <!-- Aktionen rechts -->
                        <div class="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-3">
                            <button @click="showEditModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                                <PencilIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span>{{ t('company.show.edit') }}</span>
                            </button>
                            <button @click="showDocumentModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <FolderIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span>{{ t('company.show.upload_document') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Linke Spalte - Firmen-Informationen -->
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900 rounded-lg">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <button @click="showCompanyInfo = !showCompanyInfo" 
                                    class="flex items-center justify-between w-full text-left">
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ t('company.show.company_info') }}</h3>
                                <ChevronDownIcon v-if="showCompanyInfo" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                                <ChevronRightIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div v-if="showCompanyInfo" class="p-4 sm:p-6">
                            <div class="space-y-6">
                                <!-- Firmendaten -->
                                <div class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <BuildingOfficeIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('company.show.company_data') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.index.name') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.name }}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.index.address') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.address }}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.index.location') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.postal }} {{ companyData.city }}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.index.email') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.email }}</p>
                                        </div>
                                        <div v-if="companyData.tax_identification_number">
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.tax_identification_number') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.tax_identification_number }}</p>
                                        </div>
                                        <div v-if="companyData.security_service">
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.security_service') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.security_service }}%</p>
                                        </div>
                                        <div v-if="companyData.cash_discount">
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.cash_discount') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ companyData.cash_discount }}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rechte Spalte - Dokumente -->
                <div class="lg:col-span-2">
                    <div class="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900 rounded-lg">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <button @click="showDocuments = !showDocuments" 
                                    class="flex items-center justify-between w-full text-left">
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ t('company.show.documents') }}</h3>
                                <ChevronDownIcon v-if="showDocuments" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                                <ChevronRightIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div v-if="showDocuments" class="p-4 sm:p-6">
                            <div v-if="companyData.documents && companyData.documents.length > 0" class="space-y-2">
                                <div v-for="doc in companyData.documents" :key="doc.id" 
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
                                            class="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            :title="t('common.delete_document')">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="text-center py-12">
                                <DocumentIcon class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p class="text-gray-500 dark:text-gray-400">{{ t('company.show.no_documents') }}</p>
                            </div>
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
                                {{ t('company.show.upload_document') }}
                            </h3>
                            <button @click="showDocumentModal = false" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="mt-2">
                            <CompanyDocumentUploader :company-id="company.id" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Firma bearbeiten Modal -->
        <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" aria-hidden="true" @click="showEditModal = false"></div>

                <!-- Modal panel -->
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl dark:shadow-gray-900 transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                    <form @submit.prevent="updateCompany" enctype="multipart/form-data" class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg sm:text-xl font-medium text-gray-900 dark:text-white" id="modal-title">
                                {{ t('company.show.edit') }}
                            </h3>
                            <button type="button" @click="showEditModal = false" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Linke Spalte: Bild und grundlegende Daten -->
                            <div>
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.profile_image') }}</label>
                                    <div class="mt-1 flex items-center">
                                        <img :src="getImageSrc()" alt="Firmenlogo" class="w-24 h-24 object-cover rounded-lg mr-4 border border-gray-300 dark:border-gray-600" />
                                        <input type="file" @change="handleImageUpload" accept="image/*" class="text-sm text-gray-500 dark:text-gray-400 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300" />
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label for="edit-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.name') }}</label>
                                    <input id="edit-name" v-model="editForm.name" type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                </div>

                                <div class="mb-4">
                                    <label for="edit-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.email') }}</label>
                                    <input id="edit-email" v-model="editForm.email" type="email" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                </div>

                                <div class="mb-4">
                                    <label for="edit-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.address') }}</label>
                                    <input id="edit-address" v-model="editForm.address" type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>

                            <!-- Rechte Spalte: Weitere Daten -->
                            <div>
                                <div class="mb-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label for="edit-postal" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.postal') }}</label>
                                        <input id="edit-postal" v-model="editForm.postal" type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <label for="edit-city" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.city') }}</label>
                                        <input id="edit-city" v-model="editForm.city" type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label for="edit-tax-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.tax_identification_number') }}</label>
                                    <input id="edit-tax-id" v-model="editForm.tax_identification_number" type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                </div>

                                <div class="mb-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label for="edit-security-service" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.security_service') }}</label>
                                        <input id="edit-security-service" v-model.number="editForm.security_service" type="number" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <label for="edit-cash-discount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.cash_discount') }}</label>
                                        <input id="edit-cash-discount" v-model.number="editForm.cash_discount" type="number" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end space-x-3">
                            <button type="button" @click="showEditModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {{ t('common.cancel') }}
                            </button>
                            <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {{ t('common.save') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

