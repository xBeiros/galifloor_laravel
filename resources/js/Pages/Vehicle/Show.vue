<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm, router } from '@inertiajs/vue3';
import { defineProps, ref, computed } from 'vue';
import VehicleDocumentUploader from '@/Components/VehicleDocumentUploader.vue';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon, PencilIcon, TruckIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    vehicle: Object
});

const vehicleData = ref({ ...props.vehicle });

const showVehicleInfo = ref(true);
const showDocuments = ref(true);
const showDocumentModal = ref(false);
const showEditModal = ref(false);

const editForm = useForm({
    license_plate: props.vehicle.license_plate || '',
    vehicle_identification_number: props.vehicle.vehicle_identification_number || '',
    status: props.vehicle.status || 'registered',
    notes: props.vehicle.notes || '',
    image: null
});

const updateVehicle = () => {
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
    
    fetch(`/vehicle/${props.vehicle.id}`, {
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
        
        if (data.success && data.vehicle) {
            Object.assign(vehicleData.value, data.vehicle);
            router.reload();
        }
    })
    .catch(error => {
        console.error('Update error:', error);
    });
};

const getImageSrc = () => {
    const vehicle = vehicleData.value;
    
    if (vehicle.image_url) {
        return vehicle.image_url;
    }
    
    if (vehicle.image_path) {
        if (vehicle.image_path.startsWith('storage/')) {
            return '/' + vehicle.image_path;
        } else if (vehicle.image_path.startsWith('/storage/')) {
            return vehicle.image_path;
        } else {
            return '/storage/' + vehicle.image_path;
        }
    }
    
    return '/images/default-user.svg';
};

const handleImageError = (event) => {
    event.target.src = '/images/default-user.svg';
};

const deleteDocument = (documentId) => {
    if (confirm('Möchtest du dieses Dokument wirklich löschen?')) {
        const form = useForm({});
        
        form.delete(`/vehicle/document/${documentId}`, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload();
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

const getStatusColor = (status) => {
    switch(status) {
        case 'registered':
            return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        case 'unregistered':
            return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
        case 'sold':
            return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        default:
            return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
};

const getStatusText = (status) => {
    switch(status) {
        case 'registered':
            return t('vehicle.show.status_map.registered');
        case 'unregistered':
            return t('vehicle.show.status_map.unregistered');
        case 'sold':
            return t('vehicle.show.status_map.sold');
        default:
            return status;
    }
};
</script>

<template>
    <Head :title="vehicleData.license_plate" />
    <AuthenticatedLayout>
        <template #header>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {{ vehicleData.license_plate }}
                </h2>
                <span :class="['px-3 py-1 rounded-full text-xs sm:text-sm font-medium', getStatusColor(vehicleData.status)]">
                    {{ getStatusText(vehicleData.status) }}
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
                                     alt="Fahrzeugbild" 
                                     class="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border-4 border-white dark:border-gray-800 shadow-lg" 
                                     @error="handleImageError" />
                                <div class="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                                    <TruckIcon class="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ vehicleData.license_plate }}</h1>
                                <p class="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">{{ t('vehicle.vehicle_identification_number') }}: {{ vehicleData.vehicle_identification_number }}</p>
                            </div>
                        </div>
                        
                        <!-- Aktionen rechts -->
                        <div class="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-3">
                            <button @click="showEditModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                                <PencilIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span>{{ t('vehicle.show.edit') }}</span>
                            </button>
                            <button @click="showDocumentModal = true"
                                    class="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <FolderIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span>{{ t('vehicle.show.upload_document') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Linke Spalte - Fahrzeug-Informationen -->
                <div class="lg:col-span-1">
                    <div class="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900 rounded-lg">
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <button @click="showVehicleInfo = !showVehicleInfo" 
                                    class="flex items-center justify-between w-full text-left">
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ t('vehicle.show.vehicle_info') }}</h3>
                                <ChevronDownIcon v-if="showVehicleInfo" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                                <ChevronRightIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div v-if="showVehicleInfo" class="p-4 sm:p-6">
                            <div class="space-y-6">
                                <!-- Fahrzeugdaten -->
                                <div class="space-y-3">
                                    <h4 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                        <TruckIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                        {{ t('vehicle.show.vehicle_data') }}
                                    </h4>
                                    <div class="space-y-2">
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('vehicle.license_plate') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ vehicle.license_plate }}</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('vehicle.vehicle_identification_number') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium font-mono">{{ vehicle.vehicle_identification_number }}</p>
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{{ t('vehicle.status') }}</label>
                                            <span :class="['inline-flex px-2 py-1 text-xs font-medium rounded-full', getStatusColor(vehicle.status)]">
                                                {{ getStatusText(vehicle.status) }}
                                            </span>
                                        </div>
                                        <div v-if="vehicle.notes">
                                            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('vehicle.notes') }}</label>
                                            <p class="text-sm text-gray-900 dark:text-white font-medium">{{ vehicle.notes }}</p>
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
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ t('vehicle.show.documents') }}</h3>
                                <ChevronDownIcon v-if="showDocuments" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                                <ChevronRightIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>
                        <div v-if="showDocuments" class="p-4 sm:p-6">
                            <div v-if="vehicleData.documents && vehicleData.documents.length > 0" class="space-y-2">
                                <div v-for="doc in vehicleData.documents" :key="doc.id" 
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
                                            title="Dokument löschen">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="text-center py-12">
                                <DocumentIcon class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p class="text-gray-500 dark:text-gray-400">{{ t('vehicle.show.no_documents') }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dokument hochladen Modal -->
        <div v-if="showDocumentModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900/75 transition-opacity" aria-hidden="true" @click="showDocumentModal = false"></div>

                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl dark:shadow-gray-900 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                                {{ t('vehicle.show.upload_document') }}
                            </h3>
                            <button @click="showDocumentModal = false" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="mt-2">
                            <VehicleDocumentUploader :vehicle-id="vehicle.id" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fahrzeug bearbeiten Modal -->
        <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" aria-hidden="true" @click="showEditModal = false"></div>

                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl dark:shadow-gray-900 transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form @submit.prevent="updateVehicle" enctype="multipart/form-data" class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg sm:text-xl font-medium text-gray-900 dark:text-white" id="modal-title">
                                Fahrzeug bearbeiten
                            </h3>
                            <button type="button" @click="showEditModal = false" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.license_plate') }}</label>
                                <input v-model="editForm.license_plate" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" required />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.vehicle_identification_number') }}</label>
                                <input v-model="editForm.vehicle_identification_number" type="text" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" required />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.status') }}</label>
                                <select v-model="editForm.status" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                                    <option value="registered">{{ t('vehicle.status_map.registered') }}</option>
                                    <option value="unregistered">{{ t('vehicle.status_map.unregistered') }}</option>
                                    <option value="sold">{{ t('vehicle.status_map.sold') }}</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.notes') }}</label>
                                <textarea v-model="editForm.notes" rows="3" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.index.modal.image') }}</label>
                                <input @change="editForm.image = $event.target.files[0]" type="file" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800" />
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end space-x-3">
                            <button type="button" @click="showEditModal = false" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                {{ t('vehicle.index.modal.cancel') }}
                            </button>
                            <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                {{ t('vehicle.index.modal.save') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

