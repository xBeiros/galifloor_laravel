<template>
    <div class="mt-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ t('charges.title') }}
            </h2>
            <button
                v-if="props.showForm"
                type="button"
                @click="emit('close')"
                class="rounded-md bg-gray-600 dark:bg-gray-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
                {{ t('charges.close') }}
            </button>
        </div>
        
        <!-- Formular zum Hinzufügen einer Belastungsanzeige -->
        <div v-if="props.showForm" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <form @submit.prevent="submitCharge" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('charges.description') }}
                        </label>
                        <input
                            v-model="form.description"
                            type="text"
                            required
                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                            :placeholder="t('charges.description_placeholder')"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('charges.amount') }}
                        </label>
                        <input
                            v-model="form.amount"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('charges.date') }}
                        </label>
                        <input
                            v-model="form.date"
                            type="date"
                            required
                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('charges.file') }} ({{ t('charges.optional') }})
                        </label>
                        <input
                            ref="fileInput"
                            type="file"
                            @change="handleFileSelect"
                            accept="image/*,.pdf"
                            class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                        />
                    </div>
                </div>
                
                <button
                    type="submit"
                    :disabled="form.processing"
                    class="inline-flex justify-center rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                    {{ t('charges.add') }}
                </button>
            </form>
        </div>
        
        <!-- Liste der Belastungsanzeigen -->
        <div v-if="charges && charges.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900 border border-gray-200 dark:border-gray-700">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ t('charges.date') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ t('charges.description') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ t('charges.amount') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ t('charges.file') }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {{ t('charges.actions') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-for="charge in charges" :key="charge.id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {{ formatDate(charge.date) }}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {{ charge.description }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                                {{ parseFloat(charge.amount).toFixed(2) }} €
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <a
                                    v-if="charge.file_path"
                                    :href="'/storage/' + charge.file_path"
                                    target="_blank"
                                    class="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    {{ charge.file_name }}
                                </a>
                                <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    @click="deleteCharge(charge.id)"
                                    class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                    :title="t('charges.delete')"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-5 h-5">
                                        <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot v-if="totalAmount > 0" class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <td colspan="2" class="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                {{ t('charges.total') }}:
                            </td>
                            <td class="px-6 py-3 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
                                {{ totalAmount.toFixed(2) }} €
                            </td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('charges.no_charges') }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';

const { t } = useI18n();

const props = defineProps({
    invoiceId: Number,
    charges: Array,
    invoice: Object,
});

const emit = defineEmits(['close']);
const fileInput = ref(null);
const selectedFile = ref(null);

const form = useForm({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    invoice_id: props.invoiceId,
    file: null,
});

const handleFileSelect = (event) => {
    if (event.target.files.length > 0) {
        selectedFile.value = event.target.files[0];
        form.file = selectedFile.value;
    }
};

const submitCharge = () => {
    form.post('/charges', {
        preserveScroll: true,
        onSuccess: () => {
            form.reset();
            form.date = new Date().toISOString().split('T')[0];
            form.invoice_id = props.invoiceId;
            selectedFile.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
            // Formular nach erfolgreichem Speichern ausblenden
            emit('close');
        },
    });
};

const deleteCharge = (chargeId) => {
    if (!confirm(t('charges.delete_confirm'))) {
        return;
    }
    
    const deleteForm = useForm({});
    deleteForm.delete(`/charges/${chargeId}`, {
        preserveScroll: true,
    });
};

const formatDate = (date) => {
    return dayjs(date).format('DD.MM.YYYY');
};

const totalAmount = computed(() => {
    if (!props.charges || props.charges.length === 0) return 0;
    return props.charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
});
</script>
