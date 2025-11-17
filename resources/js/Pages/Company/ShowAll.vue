<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import { 
    BuildingOfficeIcon, 
    MapPinIcon, 
    EnvelopeIcon, 
    HashtagIcon,
    UserIcon,
    PhoneIcon,
    UsersIcon
} from '@heroicons/vue/24/outline';
import { Link } from '@inertiajs/vue3';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    ownCompany: Object,
    employees: Array
});

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};
</script>

<template>
    <Head :title="t('company.show_all.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                {{ t('company.show_all.title') }}
            </h2>
        </template>

        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg">
                <div class="p-4 sm:p-6">
                    <!-- Header mit Logo und Name -->
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                        <div class="flex items-center space-x-4 sm:space-x-6">
                            <div class="relative flex-shrink-0">
                                <img 
                                    v-if="ownCompany?.image_url" 
                                    :src="ownCompany.image_url" 
                                    alt="Firmenlogo" 
                                    class="w-16 h-16 sm:w-24 sm:h-24 object-contain rounded-lg border-4 border-white shadow-lg"
                                />
                                <div v-else class="w-16 h-16 sm:w-24 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <BuildingOfficeIcon class="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ ownCompany?.name || 'Gali Floor' }}</h3>
                                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {{ ownCompany?.address || 'Josefstr. 1' }}, {{ ownCompany?.postal || '59067' }} {{ ownCompany?.city || 'Hamm' }}
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
                                <div v-if="ownCompany?.email">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.email') }}</label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center mt-1">
                                        <EnvelopeIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ ownCompany.email }}
                                    </p>
                                </div>
                                <div v-if="ownCompany?.email_secondary">
                                    <label class="text-xs font-medium text-gray-500">{{ t('company.show_all.email_secondary') }}</label>
                                    <p class="text-sm text-gray-900 font-medium flex items-center mt-1">
                                        <EnvelopeIcon class="w-4 h-4 mr-1 text-gray-400" />
                                        {{ ownCompany.email_secondary }}
                                    </p>
                                </div>
                                <div v-if="ownCompany?.phone">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('company.show_all.phone') }}</label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium flex items-center mt-1">
                                        <PhoneIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ ownCompany.phone }}
                                    </p>
                                </div>
                                <div v-if="!ownCompany?.email && !ownCompany?.email_secondary && !ownCompany?.phone" class="text-xs text-gray-500 dark:text-gray-400 italic">
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
                                        {{ ownCompany?.address || 'Josefstr. 1' }}
                                    </p>
                                </div>
                                <div class="flex items-end gap-2">
                                    <div>
                                        <label class="text-xs font-medium text-gray-500">{{ t('company.show_all.postal') }}</label>
                                        <p class="text-sm text-gray-900 font-medium mt-1">
                                            {{ ownCompany?.postal || '59067' }}
                                        </p>
                                    </div>
                                    <div>
                                        <label class="text-xs font-medium text-gray-500">{{ t('company.show_all.city') }}</label>
                                        <p class="text-sm text-gray-900 font-medium mt-1">
                                            {{ ownCompany?.city || 'Hamm' }}
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
                                <div v-if="ownCompany?.tax_identification_number">
                                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                        <HashtagIcon class="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                                        {{ t('company.show_all.tax_id') }}
                                    </label>
                                    <p class="text-sm text-gray-900 dark:text-white font-medium mt-1 font-mono">
                                        {{ ownCompany.tax_identification_number }}
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
                                            {{ ownCompany?.owner_name || 'Stefan Asenov Rangelov' }}
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
                                        <p class="text-sm text-gray-900 font-medium">
                                            {{ ownCompany?.represented_by || 'Demet Güngör' }}
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
    </AuthenticatedLayout>
</template>
