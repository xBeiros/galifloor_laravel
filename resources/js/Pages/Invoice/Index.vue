<script setup>
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.vue";
import ShowInvoice from './Show.vue'
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import {
    Dialog,
    DialogOverlay,
    DialogPanel,
    DialogTitle,
    Switch,
    TransitionChild,
    TransitionRoot,
} from "@headlessui/vue";
import { ErrorMessage, Field, Form as VeeForm } from "vee-validate";
import * as yup from "yup";
import { onMounted, ref, computed } from "vue";
import axios from "axios";
import { router } from "@inertiajs/vue3";
import { useI18n } from 'vue-i18n';
import { Head } from '@inertiajs/vue3';
import StatusBadge from '@/Components/StatusBadge.vue';

const { t } = useI18n();

const open = ref(false);
const companies = ref([]);
const invoices = ref([]);

// Filter und Suchfelder
const searchInvoiceNumber = ref("");
const searchCity = ref("");
const searchCompanyName = ref("");
const selectedStatus = ref("");

// Verfügbare Status-Optionen
const statusOptions = [
    { value: "", label: t('invoices.filter.all_statuses') },
    { value: "in_progress", label: t('invoices.show.status.in_progress') },
    { value: "waiting_for_invoice", label: t('invoices.show.status.waiting_for_invoice') },
    { value: "invoice_sent", label: t('invoices.show.status.invoice_sent') },
    { value: "completed", label: t('invoices.show.status.completed') },
    { value: "canceled", label: t('invoices.show.status.canceled') },
];

// Gefilterte Rechnungen
const filteredInvoices = computed(() => {
    return invoices.value.filter((invoice) => {
        // Filter nach Status
        if (selectedStatus.value && invoice.status !== selectedStatus.value) {
            return false;
        }

        // Suche nach Rechnungsnummer (year-order_number)
        const invoiceNumber = `${invoice.year}-${invoice.order_number}`;
        if (searchInvoiceNumber.value && !invoiceNumber.toLowerCase().includes(searchInvoiceNumber.value.toLowerCase())) {
            return false;
        }

        // Suche nach Stadt
        if (searchCity.value && !invoice.city?.toLowerCase().includes(searchCity.value.toLowerCase())) {
            return false;
        }

        // Suche nach Firmenname
        if (searchCompanyName.value && !invoice?.company?.name?.toLowerCase().includes(searchCompanyName.value.toLowerCase())) {
            return false;
        }

        return true;
    });
});

const fetchCompanies = async () => {
    try {
        const response = await axios.get("/api/companies");
        companies.value = response.data;
    } catch (error) {
        console.error("Fehler beim Laden der Unternehmen:", error);
    }
};

const onSubmit = async (values) => {
    try {
        await axios.get("/sanctum/csrf-cookie");
        const response = await axios.post("/api/invoices", values, {
            withCredentials: true,
        });

        //toast.success('Rechnung erfolgreich erstellt!');
        open.value = false;
    } catch (error) {
        console.error("Fehler beim Erstellen der Rechnung:", error);
        //toast.error('Fehler beim Erstellen der Rechnung');
    }
};

const fetchInvoices = async () => {
    try {
        const response = await axios.get("/api/invoices");
        invoices.value = response.data;
    } catch (error) {
        console.error("Fehler beim Laden der Rechnungen:", error);
    }
};

const goToInvoice = async (invoiceId) => {
    try {
        console.log("Navigiere zu Rechnung:", invoiceId);
        await router.visit(`/invoice/${invoiceId}`);
    } catch (error) {
        console.error("Navigation fehlgeschlagen:", error);
    }
};

const schema = yup.object({
    project_number: yup.string().required(),
    company_id: yup.number().required(),
    construction: yup.string().required(),
    address: yup.string().required(),
    postal: yup.string().required(),
    city: yup.string().required(),
});

onMounted(async () => {
    await fetchCompanies();
    await fetchInvoices();
});
</script>


<template>
    <Head :title="t('invoices.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2
                class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200"
            >
                {{ t('invoices.title') }}
            </h2>
        </template>

        <div class="">
            <div class="sm:flex sm:items-center">
                <div class="sm:flex-auto">
                    <h1 class="text-base font-semibold text-gray-900 dark:text-white">{{ t('invoices.title') }}</h1>
                    <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{{ t('invoices.description') }}</p>
                </div>
                <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button @click="open = true" type="button" class="block flex rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon class="h-5 w-5 mr-1" aria-hidden="true" />
                        {{ t('invoices.add_order') }}
                    </button>
                </div>
            </div>
            
            <!-- Filter und Suchfelder -->
            <div class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Status Filter -->
                    <div>
                        <label for="status-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('invoices.filter.status') }}
                        </label>
                        <select
                            id="status-filter"
                            v-model="selectedStatus"
                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                        >
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <!-- Suche Rechnungsnummer -->
                    <div>
                        <label for="search-invoice-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('invoices.filter.invoice_number') }}
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="search-invoice-number"
                                v-model="searchInvoiceNumber"
                                type="text"
                                :placeholder="t('invoices.filter.search_invoice_number')"
                                class="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                            />
                        </div>
                    </div>

                    <!-- Suche Stadt -->
                    <div>
                        <label for="search-city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('invoices.filter.city') }}
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="search-city"
                                v-model="searchCity"
                                type="text"
                                :placeholder="t('invoices.filter.search_city')"
                                class="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                            />
                        </div>
                    </div>

                    <!-- Suche Firmenname -->
                    <div>
                        <label for="search-company" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ t('invoices.filter.company') }}
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="search-company"
                                v-model="searchCompanyName"
                                type="text"
                                :placeholder="t('invoices.filter.search_company')"
                                class="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
                
                <!-- Ergebnis-Anzeige -->
                <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {{ t('invoices.filter.showing') }} {{ filteredInvoices.length }} {{ t('invoices.filter.of') }} {{ invoices.length }} {{ t('invoices.filter.invoices') }}
                </div>
            </div>

            <div class="mt-8 flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                            <thead>
                            <tr>
                                <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter">{{ t('invoices.invoice_number') }}</th>
                                <th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter sm:table-cell">{{ t('invoices.project_number') }}</th>
                                <th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter lg:table-cell">{{ t('invoices.company') }}</th>
                                <th scope="col" class="sticky top-0 z-10 hidden border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter lg:table-cell">{{ t('invoices.construction') }}</th>
                                <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter">{{ t('invoices.address') }}</th>
                                <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter">{{ t('invoices.city') }}</th>
                                <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white backdrop-blur backdrop-filter">{{ t('invoices.status') }}</th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr v-for="(invoice, invoiceIdx) in filteredInvoices" :key="invoice.id" @click="goToInvoice(invoice.id)" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'whitespace-nowrap py-4 pr-3 text-sm font-medium text-gray-900 dark:text-white']">{{ invoice.year }}-{{invoice.order_number}}</td>
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell']">{{ invoice.project_number }}</td>
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 lg:table-cell']">{{ invoice?.company?.name }}</td>
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis']">{{ invoice.construction}}</td>
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis']">{{ invoice.address }}</td>
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis']">{{ invoice.city }}</td>
                                <td :class="[invoiceIdx !== invoice.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : '', 'whitespace-nowrap px-3 py-4 text-sm']">
                                    <StatusBadge v-if="invoice.status" :status="invoice.status" />
                                    <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <TransitionRoot as="template" :show="open" style="z-index: 9999;">
            <Dialog class="relative z-10" @close="open = false">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" />
                </TransitionChild>

                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl dark:shadow-gray-900 transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <VeeForm v-slot="{ handleSubmit, isSubmitting, values }" :validation-schema="schema">
                                    <form @submit.prevent="handleSubmit(onSubmit)" class="space-y-6">
                                        <div>
                                            <label for="project_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('invoices.modal.project_number') }}</label>
                                            <Field id="project_number" name="project_number" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="project_number" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                        </div>

                                        <div>
                                            <label for="company" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('invoices.modal.company') }}</label>
                                            <Field as="select" id="company" name="company_id" required class="block w-full py-1.5 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                <option v-for="company in companies" :key="company.id" :value="company.id">
                                                    {{ company.name }}
                                                </option>
                                            </Field>
                                        </div>

                                        <div>
                                            <label for="construction" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('invoices.modal.construction') }}</label>
                                            <Field id="construction" name="construction" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="construction" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                        </div>

                                        <div>
                                            <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('invoices.modal.address') }}</label>
                                            <Field id="address" name="address" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="address" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                        </div>

                                        <div class="flex">
                                            <div>
                                                <label for="postal" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('invoices.modal.postal') }}</label>
                                                <Field id="postal" name="postal" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                <ErrorMessage name="postal" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                            <div class="mx-2"></div>
                                            <div>
                                                <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('invoices.modal.city') }}</label>
                                                <Field id="city" name="city" type="text" class="block w-full mt-1 border-2 border-gray-700/50 dark:border-gray-600 rounded-md p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                <ErrorMessage name="city" class="mt-2 text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <button :disabled="isSubmitting" type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                {{ t('invoices.modal.submit') }}
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
    </AuthenticatedLayout>
</template>

<style scoped>
.whitespace-nowrap {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px; /* Adjust the width as needed */
}
</style>
