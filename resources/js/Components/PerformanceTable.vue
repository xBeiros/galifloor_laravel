<script setup>
import {computed, ref} from "vue";
import {
    Dialog,
    DialogPanel,
    TransitionChild,
    TransitionRoot,
    Switch,
} from "@headlessui/vue";
import dayjs from "dayjs";
import { ErrorMessage, Field, Form as VeeForm } from "vee-validate";
import * as yup from "yup";
import { usePerformanceStore } from "@/store/performanceStore";
import { useI18n } from 'vue-i18n';
import { router } from '@inertiajs/vue3';

const { t } = useI18n();

const props = defineProps({
    order: Object,
    order_number: Number
});

const open = ref(false);
const changeDate = ref(false);
const selectedDate = ref("");
const selectedPerformanceId = ref(null);
const dateTime = ref("");
const endDateTime = ref("");
const flatrate = ref(false);
const multipleDays = ref(false);
const performanceStore = usePerformanceStore();
const performances = computed(() => {
    if (!props.order) return [];
    if (Array.isArray(props.order)) return props.order;
    // Falls es ein einzelnes Objekt ist, mache es zu einem Array
    if (typeof props.order === 'object' && props.order !== null) return [props.order];
    return [];
});

const schema = computed(() => {
    const baseSchema = {
        qm: yup.string().required(),
        price: yup.string().required(),
        performance: yup.string().required(),
        flatrate: yup.boolean(),
    };
    
    if (multipleDays.value) {
        baseSchema.end_date = yup.string()
            .required(t('performance.end_date_required'))
            .test('after-start', t('performance.end_date_after_start'), function(value) {
                if (!value || !dateTime.value) return true;
                return new Date(value) >= new Date(dateTime.value);
            });
    }
    
    return yup.object(baseSchema);
});

const flatrateText = (flatrate) => (flatrate ? t('performance.flatrate') : t('performance.not_flatrate'));

const formatDateHours = (date) => dayjs(date).format("DD.MM.YYYY HH:mm");

const calculateTotalPrice = () => {
    if (!Array.isArray(performances.value)) return 0;

    return performances.value.reduce(
        (total, { qm, price, status, flatrate }) => {
            const numQm = parseFloat(qm || 0);
            const numPrice = parseFloat(price || 0);
            return status !== "canceled"
                ? total + (flatrate ? numPrice : numQm * numPrice)
                : total;
        },
        0
    );
};


const getStatusBadge = (status) => {
    const statusMap = {
        canceled: { label: t('performance.status_map.canceled'), class: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
        date_change: { label: t('performance.status_map.date_change'), class: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" },
        no_change: { label: t('performance.status_map.no_change'), class: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
    };
    return statusMap[status] ?? { label: t('performance.status_map.unknown'), class: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" };
};

const handleDateChange = (event) => {
    const inputDate = event.target.value;
    dateTime.value = dayjs(inputDate).format("YYYY-MM-DDTHH:mm");
};

const handleEndDateChange = (event) => {
    const inputDate = event.target.value;
    endDateTime.value = dayjs(inputDate).format("YYYY-MM-DDTHH:mm");
};

const onSubmit = async (values) => {
    try {
        // Formatiere Datum korrekt für das Backend
        const formattedStartDate = dateTime.value ? dayjs(dateTime.value).format("YYYY-MM-DD HH:mm:ss") : null;
        const formattedEndDate = multipleDays.value && endDateTime.value 
            ? dayjs(endDateTime.value).format("YYYY-MM-DD HH:mm:ss") 
            : null;
        
        const performanceData = {
            ...values,
            flatrate: flatrate.value,
            multiple_days: multipleDays.value,
            date: formattedStartDate,
            end_date: formattedEndDate,
        };
        
        await performanceStore.addPerformance(performanceData, props.order_number, formattedStartDate);
        
        // Formular zurücksetzen
        flatrate.value = false;
        multipleDays.value = false;
        dateTime.value = "";
        endDateTime.value = "";
        open.value = false;
        
        // Seite neu laden, um die neuen Performances anzuzeigen
        router.reload({ preserveScroll: true });
    } catch (e) {
        console.error(e);
    }
};

const changeToCanceled = async (id) => {
    try {
        await performanceStore.changePerformanceStatus(id, "canceled");
        router.reload({ preserveScroll: true });
    } catch (e) {
        console.error("Fehler beim Stornieren der Performance:", e);
    }
};

const deletePerformance = async (id) => {
    try {
        await performanceStore.deletePerformance(id);
        router.reload({ preserveScroll: true });
    } catch (e) {
        console.error(e);
    }
};

const openChangeDateDialog = (performanceId, currentChangeDate) => {
    selectedPerformanceId.value = performanceId;
    selectedDate.value = dayjs(currentChangeDate).format("YYYY-MM-DDTHH:mm");
    changeDate.value = true;
};

const changeToNoChange = async (id) => {
    try {
        await performanceStore.changePerformanceStatus(id, "no_change");
        router.reload({ preserveScroll: true });
    } catch (e) {
        console.error("Fehler beim Wiederherstellen der Performance:", e);
    }
};

const updateDateChange = async () => {
    try {
        if (selectedPerformanceId.value && selectedDate.value) {
            const formattedDate = dayjs(selectedDate.value).format("YYYY-MM-DD HH:mm:ss");

            await performanceStore.changePerformanceDate(
                selectedPerformanceId.value,
                formattedDate,
                "date_change"
            );

            changeDate.value = false;
            router.reload({ preserveScroll: true });
        }
    } catch (e) {
        console.error("Fehler beim Ändern des Datums:", e);
    }
};
</script>

<template>
    <div class="mt-10">
        <div class="flex sm:justify-end">
            <button
                type="button"
                @click="open = true"
                class="w-full sm:w-auto rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-indigo-600"
            >
                {{ t('performance.add') }}
            </button>
        </div>
        <div class="mt-8 flow-root">
            <div class="inline-block min-w-full py-2 align-middle">
                <!-- Desktop Table View -->
                <div class="overflow-x-auto hidden md:block">
                    <div class="overflow-hidden shadow dark:shadow-gray-900 ring-1 ring-black/5 dark:ring-white/10 sm:rounded-lg">
                        <table class="table-auto divide-y divide-gray-300 dark:divide-gray-700 min-w-full">
                            <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">{{ t('performance.performance') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.date') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.qm') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.price_per_qm') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.flatrate') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.total_price') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.status') }}</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">{{ t('performance.action') }}</th>
                            </tr>
                            </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        <tr v-for="performance in performances" :key="performance?.id || performance?.invoice_id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td class="max-w-xs truncate whitespace-nowrap overflow-hidden py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                {{ performance?.performance }}
                            </td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                <div v-if="performance?.status === 'date_change'">
                                    <p>{{ formatDateHours(performance?.date_changed_to) }}</p>
                                    <p class="line-through text-red-600 dark:text-red-400">{{ formatDateHours(performance?.date) }}</p>
                                </div>
                                <div v-else>
                                    <p v-if="performance?.end_date">
                                        {{ formatDateHours(performance?.date) }} - {{ formatDateHours(performance?.end_date) }}
                                    </p>
                                    <p v-else>{{ formatDateHours(performance?.date) }}</p>
                                </div>
                            </td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ performance.qm }} qm</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ parseFloat(performance.price || 0).toFixed(2) }} €</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{{ flatrateText(performance.flatrate) }}</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                <div v-if="!performance.flatrate">
                                    <p v-if="performance.status === 'canceled'" class="line-through">
                                        {{ (parseFloat(performance.qm || 0) * parseFloat(performance.price || 0)).toFixed(2) }} €
                                    </p>
                                    <p v-else>
                                        {{ (parseFloat(performance.qm || 0) * parseFloat(performance.price || 0)).toFixed(2) }} €
                                    </p>
                                </div>
                                <div v-else>
                                    <p v-if="performance.status === 'canceled'" class="line-through">
                                        {{ parseFloat(performance.price || 0).toFixed(2) }} €
                                    </p>
                                    <p v-else>
                                        {{ parseFloat(performance.price || 0).toFixed(2) }} €
                                    </p>
                                </div>
                            </td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm">
                              <span :class="'inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ' + getStatusBadge(performance.status).class">
                                {{ getStatusBadge(performance.status).label }}
                              </span>
                            </td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm flex justify-center items-center">
                                <div>
                                    <button v-if="performance.status !== 'canceled'" @click="changeToCanceled(performance.id)">
                                        <!-- Button zum Stornieren -->
                                        <svg class="w-4 h-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                        </svg>
                                    </button>

                                    <button v-else @click="changeToNoChange(performance.id)">
                                        <!-- Button zum Wiederherstellen -->
                                        <svg class="w-4 h-4 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <button @click="deletePerformance(performance.id)">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4 ml-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <button @click="openChangeDateDialog(performance.id, performance.date_change_to || performance.date)">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4 ml-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                            <path d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Mobile Card View -->
                <div class="md:hidden space-y-4">
                    <div v-for="performance in performances" :key="performance?.id || performance?.invoice_id" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                        <div class="space-y-3">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ performance?.performance }}</h3>
                                </div>
                                <span :class="'inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ' + getStatusBadge(performance.status).class">
                                    {{ getStatusBadge(performance.status).label }}
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span class="font-medium text-gray-500 dark:text-gray-400">{{ t('performance.date') }}:</span>
                                    <div class="text-gray-900 dark:text-white mt-1">
                                        <div v-if="performance?.status === 'date_change'">
                                            <p>{{ formatDateHours(performance?.date_changed_to) }}</p>
                                            <p class="line-through text-red-600 dark:text-red-400">{{ formatDateHours(performance?.date) }}</p>
                                        </div>
                                        <div v-else>
                                            <p v-if="performance?.end_date">
                                                {{ formatDateHours(performance?.date) }} - {{ formatDateHours(performance?.end_date) }}
                                            </p>
                                            <p v-else>{{ formatDateHours(performance?.date) }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span class="font-medium text-gray-500 dark:text-gray-400">{{ t('performance.qm') }}:</span>
                                    <p class="text-gray-900 dark:text-white mt-1">{{ performance.qm }} qm</p>
                                </div>
                                <div>
                                    <span class="font-medium text-gray-500 dark:text-gray-400">{{ t('performance.price_per_qm') }}:</span>
                                    <p class="text-gray-900 dark:text-white mt-1">{{ parseFloat(performance.price || 0).toFixed(2) }} €</p>
                                </div>
                                <div>
                                    <span class="font-medium text-gray-500 dark:text-gray-400">{{ t('performance.flatrate') }}:</span>
                                    <p class="text-gray-900 dark:text-white mt-1">{{ flatrateText(performance.flatrate) }}</p>
                                </div>
                                <div class="col-span-2">
                                    <span class="font-medium text-gray-500 dark:text-gray-400">{{ t('performance.total_price') }}:</span>
                                    <div class="text-gray-900 dark:text-white mt-1">
                                        <div v-if="!performance.flatrate">
                                            <p v-if="performance.status === 'canceled'" class="line-through">
                                                {{ (parseFloat(performance.qm || 0) * parseFloat(performance.price || 0)).toFixed(2) }} €
                                            </p>
                                            <p v-else>
                                                {{ (parseFloat(performance.qm || 0) * parseFloat(performance.price || 0)).toFixed(2) }} €
                                            </p>
                                        </div>
                                        <div v-else>
                                            <p v-if="performance.status === 'canceled'" class="line-through">
                                                {{ parseFloat(performance.price || 0).toFixed(2) }} €
                                            </p>
                                            <p v-else>
                                                {{ parseFloat(performance.price || 0).toFixed(2) }} €
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <button v-if="performance.status !== 'canceled'" @click="changeToCanceled(performance.id)" class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                    <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                    </svg>
                                </button>
                                <button v-else @click="changeToNoChange(performance.id)" class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                    <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                                    </svg>
                                </button>
                                <button @click="deletePerformance(performance.id)" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4">
                                        <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                    </svg>
                                </button>
                                <button @click="openChangeDateDialog(performance.id, performance.date_change_to || performance.date)" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4">
                                        <path d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-4 flex justify-end">
            <p class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{{ t('performance.total') }}: {{ calculateTotalPrice().toFixed(2) }} €</p>
        </div>
        <TransitionRoot as="template" :show="changeDate">
            <Dialog class="relative z-50" @close="changeDate = false">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" />
                </TransitionChild>
                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl dark:shadow-gray-900 transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <div>
                                    <div class="mt-3 text-center sm:mt-5">
                                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ t('performance.change_date') }}</h3>
                                        <div class="mt-4">
                                            <input
                                                type="datetime-local"
                                                v-model="selectedDate"
                                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-5 sm:mt-6 flex justify-between">
                                    <button
                                        type="button"
                                        class="inline-flex w-1/2 justify-center rounded-md bg-gray-300 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-400 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:focus-visible:outline-gray-400"
                                        @click="changeDate = false"
                                    >
                                        {{ t('performance.cancel') }}
                                    </button>
                                    <button
                                        type="button"
                                        class="inline-flex w-1/2 justify-center ml-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        @click="updateDateChange"
                                    >
                                        {{ t('performance.save') }}
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
        <TransitionRoot as="template" :show="open">
            <Dialog class="relative z-50" @close="open = false">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" />
                </TransitionChild>
                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl dark:shadow-gray-900 transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <VeeForm v-slot="{ handleSubmit, values, errors }" :validation-schema="schema.value">
                                    <form @submit.prevent="handleSubmit(onSubmit)" class="space-y-6">
                                        <div class="flex">
                                            <div>
                                                <label for="qm" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.qm') }}</label>
                                                <Field id="qm" name="qm" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                <ErrorMessage name="qm" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                            <div class="mx-2"></div>
                                            <div>
                                                <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.price') }}</label>
                                                <Field id="price" name="price" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                <ErrorMessage name="price" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                            <div class="mx-2"></div>
                                            <div class="w-full flex-row items-center justify-center">
                                                <label for="flatrate" class="flex justify-center block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.flatrate') }}</label>
                                                <div class="mt-1 flex justify-center items-center">
                                                <Switch 
                                                    v-model="flatrate" 
                                                    :class="[flatrate ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700', 'mt-1 w-11 relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:ring-offset-2']"
                                                >
                                                        <span class="sr-only">{{ t('performance.flatrate') }}</span>
                                                        <span :class="[flatrate ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']">
                                                            <span :class="[flatrate ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']" aria-hidden="true">
                                                                <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                                                                    <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                                </svg>
                                                            </span>
                                                            <span :class="[flatrate ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']" aria-hidden="true">
                                                                <svg class="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                                                                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                                                                </svg>
                                                            </span>
                                                        </span>
                                                    </Switch>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Mehrere Tage Option -->
                                        <div class="flex items-center space-x-3">
                                            <label for="multipleDays" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.multiple_days') }}</label>
                                            <Switch 
                                                v-model="multipleDays" 
                                                :class="[multipleDays ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700', 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 focus:ring-offset-2']"
                                            >
                                                <span class="sr-only">{{ t('performance.multiple_days') }}</span>
                                                <span :class="[multipleDays ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out']">
                                                    <span :class="[multipleDays ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']" aria-hidden="true">
                                                        <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                                                            <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                        </svg>
                                                    </span>
                                                    <span :class="[multipleDays ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out', 'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity']" aria-hidden="true">
                                                        <svg class="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                                                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                                                        </svg>
                                                    </span>
                                                </span>
                                            </Switch>
                                        </div>
                                        
                                        <div>
                                            <label for="datetime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.date_time') }}</label>
                                            <input
                                                id="datetime"
                                                type="datetime-local"
                                                v-model="dateTime"
                                                @change="handleDateChange"
                                                class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        
                                        <div v-if="multipleDays">
                                            <label for="endDateTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.end_date_time') }}</label>
                                            <input
                                                id="endDateTime"
                                                type="datetime-local"
                                                v-model="endDateTime"
                                                :min="dateTime"
                                                @change="handleEndDateChange"
                                                class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('performance.multiple_days_info') }}</p>
                                        </div>
                                        <div>
                                            <label for="performance" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('performance.performance') }}</label>
                                            <Field id="performance" name="performance" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="performance" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                        </div>
                                        <div class="mt-5 sm:mt-6">
                                            <button type="submit" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                                {{ t('performance.submit') }}
                                            </button>
                                        </div>
                                    </form>
                                </VeeForm>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>
