<script setup lang="ts">
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import { useI18n } from 'vue-i18n';
import { 
    DocumentTextIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon
} from '@heroicons/vue/24/outline';

const { t } = useI18n();

const props = defineProps<{
    currentYear: number;
    statistics: {
        total_current_year: number;
        open: number;
        completed: number;
        canceled: number;
    };
}>();
</script>

<template>
    <Head :title="t('dashboard.title')" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                {{ t('dashboard.title') }}
            </h2>
        </template>

        <div class="space-y-6">
            <!-- Statistiken -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Offene Rechnungen -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-yellow-500 dark:bg-yellow-600 rounded-md p-3">
                                <ClockIcon class="h-6 w-6 text-white" />
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.open_invoices') }}</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ statistics.open }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Abgeschlossene Rechnungen -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-green-500 dark:bg-green-600 rounded-md p-3">
                                <CheckCircleIcon class="h-6 w-6 text-white" />
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.completed') }}</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ statistics.completed }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stornierte Rechnungen -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-red-500 dark:bg-red-600 rounded-md p-3">
                                <XCircleIcon class="h-6 w-6 text-white" />
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.canceled') }}</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ statistics.canceled }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rechnungen vom aktuellen Jahr -->
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm dark:shadow-gray-900 sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-indigo-500 dark:bg-indigo-600 rounded-md p-3">
                                <DocumentTextIcon class="h-6 w-6 text-white" />
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.invoices_year', { year: currentYear }) }}</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ statistics.total_current_year }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
