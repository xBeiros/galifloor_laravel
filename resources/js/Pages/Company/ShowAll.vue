<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import { 
    BuildingOfficeIcon, 
    MapPinIcon, 
    EnvelopeIcon, 
    HashtagIcon,
    UserIcon,
    PhoneIcon,
    UsersIcon,
    PencilIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline';
import { Link } from '@inertiajs/vue3';
import { Dialog, DialogPanel, TransitionRoot } from '@headlessui/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    ownCompany: Object,
    employees: Array
});

const showEditModal = ref(false);
const companyData = ref({ ...props.ownCompany });

const editForm = useForm({
    name: props.ownCompany?.name || '',
    address: props.ownCompany?.address || '',
    postal: props.ownCompany?.postal || '',
    city: props.ownCompany?.city || '',
    owner_name: props.ownCompany?.owner_name || '',
    represented_by: props.ownCompany?.represented_by || '',
    email: props.ownCompany?.email || '',
    email_secondary: props.ownCompany?.email_secondary || '',
    phone: props.ownCompany?.phone || '',
    tax_identification_number: props.ownCompany?.tax_identification_number || '',
    image: null
});

const openEditModal = () => {
    editForm.name = companyData.value?.name || props.ownCompany?.name || '';
    editForm.address = companyData.value?.address || props.ownCompany?.address || '';
    editForm.postal = companyData.value?.postal || props.ownCompany?.postal || '';
    editForm.city = companyData.value?.city || props.ownCompany?.city || '';
    editForm.owner_name = companyData.value?.owner_name || props.ownCompany?.owner_name || '';
    editForm.represented_by = companyData.value?.represented_by || props.ownCompany?.represented_by || '';
    editForm.email = companyData.value?.email || props.ownCompany?.email || '';
    editForm.email_secondary = companyData.value?.email_secondary || props.ownCompany?.email_secondary || '';
    editForm.phone = companyData.value?.phone || props.ownCompany?.phone || '';
    editForm.tax_identification_number = companyData.value?.tax_identification_number || props.ownCompany?.tax_identification_number || '';
    editForm.image = null;
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
};

const handleImageUpload = (event) => {
    const target = event.target;
    if (target.files && target.files[0]) {
        editForm.image = target.files[0];
    }
};

const updateCompany = () => {
    const formData = new FormData();
    
    Object.keys(editForm.data()).forEach(key => {
        const value = editForm.data()[key];
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        formData.append('_token', csrfToken);
    }
    
    formData.append('_method', 'PUT');
    
    fetch(route('company.details.update'), {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.ownCompany) {
            Object.assign(companyData.value, data.ownCompany);
            closeEditModal();
            router.reload({ only: ['ownCompany'] });
        }
    })
    .catch(error => {
        console.error('Update error:', error);
    });
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const getImageSrc = () => {
    if (companyData.value?.image_url) {
        return companyData.value.image_url;
    }
    return null;
};
</script>

<template>
    <Head :title="t('company.show_all.title')" />
    <AuthenticatedLayout>
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {{ t('company.show_all.title') }}
                </h2>
                <button 
                    @click="openEditModal"
                    class="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PencilIcon class="h-5 w-5 mr-2" />
                    {{ t('company.show_all.edit') }}
                </button>
            </div>
        </template>

        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg">
                <div class="p-4 sm:p-6">
                    <!-- Header mit Logo und Name -->
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                        <div class="flex items-center space-x-4 sm:space-x-6">
                            <div class="relative flex-shrink-0">
                                <img 
                                    v-if="getImageSrc() || companyData?.image_url" 
                                    :src="getImageSrc() || companyData?.image_url" 
                                    alt="Firmenlogo" 
                                    class="w-16 h-16 sm:w-24 sm:h-24 object-contain rounded-lg border-4 border-white dark:border-gray-800 shadow-lg"
                                />
                                <div v-else class="w-16 h-16 sm:w-24 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <BuildingOfficeIcon class="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ companyData?.name || ownCompany?.name || 'Gali Floor' }}</h3>
                                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {{ companyData?.address || ownCompany?.address || 'Josefstr. 1' }}, {{ companyData?.postal || ownCompany?.postal || '59067' }} {{ companyData?.city || ownCompany?.city || 'Hamm' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Firmeninformationen in Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <!-- Kontaktdaten -->
                        <div class="space-y-4">
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                <EnvelopeIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                {{ t('company.show_all.contact_data') }}
                            </h4>
                            <div class="space-y-3">
                                <div v-if="companyData?.email || ownCompany?.email">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.email') }}</label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center mt-1">
                                        <EnvelopeIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ companyData?.email || ownCompany?.email }}
                                    </p>
                                </div>
                                <div v-if="companyData?.email_secondary || ownCompany?.email_secondary">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.email_secondary') }}</label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center mt-1">
                                        <EnvelopeIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ companyData?.email_secondary || ownCompany?.email_secondary }}
                                    </p>
                                </div>
                                <div v-if="companyData?.phone || ownCompany?.phone">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.phone') }}</label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center mt-1">
                                        <PhoneIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ companyData?.phone || ownCompany?.phone }}
                                    </p>
                                </div>
                                <div v-if="!companyData?.email && !ownCompany?.email && !companyData?.email_secondary && !ownCompany?.email_secondary && !companyData?.phone && !ownCompany?.phone" class="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {{ t('company.show_all.no_contact') }}
                                </div>
                            </div>
                        </div>

                        <!-- Adressdaten -->
                        <div class="space-y-4">
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                <MapPinIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                {{ t('company.show_all.address') }}
                            </h4>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.street') }}</label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium mt-1">
                                        {{ companyData?.address || ownCompany?.address || 'Josefstr. 1' }}
                                    </p>
                                </div>
                                <div class="flex items-end gap-2">
                                    <div>
                                        <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.postal') }}</label>
                                        <p class="text-sm text-gray-900 dark:text-white font-medium mt-1">
                                            {{ companyData?.postal || ownCompany?.postal || '59067' }}
                                        </p>
                                    </div>
                                    <div>
                                        <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.city') }}</label>
                                        <p class="text-sm text-gray-900 dark:text-white font-medium mt-1">
                                            {{ companyData?.city || ownCompany?.city || 'Hamm' }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Firmeninformationen -->
                        <div class="space-y-4">
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                <HashtagIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                {{ t('company.show_all.company_info') }}
                            </h4>
                            <div class="space-y-3">
                                <div v-if="companyData?.tax_identification_number || ownCompany?.tax_identification_number">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                        <HashtagIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ t('company.show_all.tax_id') }}
                                    </label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium mt-1 font-mono">
                                        {{ companyData?.tax_identification_number || ownCompany?.tax_identification_number }}
                                    </p>
                                </div>
                                <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic">
                                    {{ t('company.show_all.no_tax_id') }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Firmenbesitzer, Vertretung und Mitarbeiter -->
                    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                            <!-- Firmenbesitzer -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                    <UserIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                    {{ t('company.show_all.owner') }}
                                </h4>
                                <div class="space-y-3">
                                    <div>
                                        <p class="text-sm text-gray-900 dark:text-white font-medium">
                                            {{ companyData?.owner_name || ownCompany?.owner_name || 'Stefan Asenov Rangelov' }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Sekretärin mit Vollmacht -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                    <UserIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                    {{ t('company.show_all.secretary') }}
                                </h4>
                                <div class="space-y-3">
                                    <div>
                                        <p class="text-sm text-gray-900 dark:text-white font-medium">
                                            {{ companyData?.represented_by || ownCompany?.represented_by || 'Demet Güngör' }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Mitarbeiter -->
                            <div class="space-y-4">
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                                    <UsersIcon class="w-5 h-5 mr-2 text-indigo-600" />
                                    {{ t('company.show_all.employees') }}
                                    <span v-if="employees && employees.length > 0" class="ml-2 px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
                                        {{ employees.length }}
                                    </span>
                                </h4>
                                <div class="space-y-3">
                                    <div v-if="employees && employees.length > 0" class="space-y-2">
                                        <div 
                                            v-for="employee in employees" 
                                            :key="employee.id"
                                            class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <div class="flex-shrink-0">
                                                <img 
                                                    v-if="employee.image_url || employee.image_path" 
                                                    :src="employee.image_url || (employee.image_path?.startsWith('/') ? employee.image_path : '/' + employee.image_path)" 
                                                    alt="Profilbild" 
                                                    class="w-10 h-10 rounded-full object-cover"
                                                    @error="$event.target.src = '/images/default-user.svg'"
                                                />
                                                <div v-else class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <UserIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                                </div>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <Link 
                                                    :href="route('employees.show', employee.id)"
                                                    class="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 block truncate"
                                                >
                                                    {{ employee.first_name }} {{ employee.last_name }}
                                                </Link>
                                                <p v-if="employee.email" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {{ employee.email }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic">
                                        {{ t('company.show_all.no_employees') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <TransitionRoot as="template" :show="showEditModal">
            <Dialog as="div" class="relative z-10" @close="closeEditModal">
                <div class="fixed inset-0 bg-black/50 dark:bg-gray-900/75" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                                    {{ t('company.show_all.edit') }}
                                </h3>
                                <button @click="closeEditModal" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                    <XMarkIcon class="w-6 h-6" />
                                </button>
                            </div>

                            <form @submit.prevent="updateCompany" enctype="multipart/form-data" class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Linke Spalte -->
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.title') }}</label>
                                            <input v-model="editForm.name" type="text" required class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.street') }}</label>
                                            <input v-model="editForm.address" type="text" required class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.postal') }}</label>
                                                <input v-model="editForm.postal" type="text" required class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.city') }}</label>
                                                <input v-model="editForm.city" type="text" required class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.email') }}</label>
                                            <input v-model="editForm.email" type="email" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.email_secondary') }}</label>
                                            <input v-model="editForm.email_secondary" type="email" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.phone') }}</label>
                                            <input v-model="editForm.phone" type="text" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>
                                    </div>

                                    <!-- Rechte Spalte -->
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.tax_id') }}</label>
                                            <input v-model="editForm.tax_identification_number" type="text" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.owner') }}</label>
                                            <input v-model="editForm.owner_name" type="text" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.show_all.secretary') }}</label>
                                            <input v-model="editForm.represented_by" type="text" class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('company.index.modal.profile_image') }}</label>
                                            <div class="mt-1 flex items-center">
                                                <img v-if="getImageSrc() || companyData?.image_url" :src="getImageSrc() || companyData?.image_url" alt="Firmenlogo" class="w-24 h-24 object-contain rounded-lg mr-4 border border-gray-300 dark:border-gray-600" />
                                                <input type="file" @change="handleImageUpload" accept="image/*" class="text-sm text-gray-500 dark:text-gray-400 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button type="button" @click="closeEditModal" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                                        {{ t('common.cancel') }}
                                    </button>
                                    <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600">
                                        {{ t('common.save') }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </TransitionRoot>
    </AuthenticatedLayout>
</template>
