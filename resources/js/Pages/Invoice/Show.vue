<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm, router } from '@inertiajs/vue3';
import { defineProps, computed, ref } from 'vue';
import { MenuButton, MenuItem, MenuItems, Menu } from '@headlessui/vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import PerformanceTable from '@/Components/PerformanceTable.vue';
import dayjs from 'dayjs';
import { generateInvoice } from '@/Composables/generateInvoicePDF';
import FileUploader from '@/Components/FileUploader.vue';
import ChargeForm from '@/Components/ChargeForm.vue';
import { generateInvoiceAndSend } from '@/Composables/generateAndSendInvoicePDF';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    invoice: Object, // Wird über Inertia von Laravel übergeben
    ownCompany: Object, // Eigene Firmendaten für E-Rechnung
});

const formattedDate = computed(() => {
    return props.invoice?.updated_at
        ? dayjs(props.invoice.updated_at).format('DD.MM.YYYY')
        : 'Unbekanntes Datum';
});

const statuses = {
    in_progress: t('invoices.show.status.in_progress'),
    waiting_for_invoice: t('invoices.show.status.waiting_for_invoice'),
    invoice_sent: t('invoices.show.status.invoice_sent'),
    completed: t('invoices.show.status.completed'),
    canceled: t('invoices.show.status.canceled'),
};

console.log(props.invoice)

const selectedStatus = ref('');
const isOpen = ref(false);

function toggleDropdown() {
    isOpen.value = !isOpen.value;
}

const issueInvoice = () => {
    // Bestätigungsabfrage
    if (!confirm(t('invoices.show.confirm_issue'))) {
        return;
    }
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    fetch(route('invoice.issue', props.invoice.id), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Invoice-Daten aktualisieren
            props.invoice.issued_at = data.invoice.issued_at;
            router.reload({ only: ['invoice'] });
        } else {
            alert(data.message || 'Fehler beim Ausstellen der Rechnung');
        }
    })
    .catch(error => {
        console.error('Fehler beim Ausstellen der Rechnung:', error);
    });
};

const previewInvoice = () => {
    if (props.invoice.issued_at) {
        alert('Diese Rechnung wurde bereits ausgestellt. Bitte verwenden Sie die Download-Funktion.');
        return;
    }
    console.log(props.invoice);
    generateInvoice(props.invoice, true);
};

const generateInvoicePDF = () => {
    if (!props.invoice.issued_at) {
        alert('Bitte stellen Sie die Rechnung zuerst aus.');
        return;
    }
    console.log(props.invoice);
    generateInvoice(props.invoice, false);
};



const sendInvoice = () => {
    if (!props.invoice.issued_at) {
        alert('Bitte stellen Sie die Rechnung zuerst aus.');
        return;
    }
    generateInvoiceAndSend(props.invoice);
};

const deleteFile = (fileId) => {
    if (confirm(t('invoices.show.delete'))) {
        const form = useForm({});

        form.delete(`/assets/${fileId}`, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Datei gelöscht:', fileId);
            },
        });
    }
};

const form = useForm({
  status: props.invoice.status,
});

function updateStatus(newStatus) {
    form.status = newStatus;         // Payload korrekt aktualisieren
    form.patch(`/invoices/${props.invoice.id}`, {
        preserveScroll: true,
        onSuccess: () => console.log('Status aktualisiert:', newStatus),
        onError:   errors => console.error(errors),
    });
}

</script>


<template>
    <Head :title="t('invoices.show.title')" />

    <AuthenticatedLayout>
        <template #header>
            <h2
                class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200"
            >
                {{ t('invoices.show.title') }}: {{ invoice.year }}-{{ invoice.order_number }}
            </h2>
        </template>

        <div>
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <!-- Linker Teil: Firmenlogo und Informationen -->
                <div class="flex">
                    <div>
                        <img :src="`${invoice?.company?.image_url}`" alt="Company Logo" class="h-16 w-16 object-contain">
                    </div>

                    <div class="ml-4">
                        <div>
                            <div class="flex flex-wrap items-center gap-2">
                                <div class="font-bold text-gray-900 dark:text-white">{{ invoice?.company?.name || 'Unbekanntes Unternehmen' }}</div>
                                <StatusBadge class="ml-0 md:ml-3" :status="invoice?.status || 'unknown'" />
                            </div>
                            <p class="text-gray-700 dark:text-gray-300 text-sm">{{ invoice?.company?.address || 'Keine Adresse' }}</p>
                            <p class="text-gray-700 dark:text-gray-300 text-sm">{{ invoice?.company?.postal || '' }} {{ invoice?.company?.city || '' }}</p>
                        </div>
                    </div>
                </div>

                <div class="w-full md:w-60">
                    <div class="w-full space-y-2">
                        <!-- Rechnung Vorschau Button (nur wenn noch nicht ausgestellt) -->
                        <button 
                            v-if="!invoice?.issued_at" 
                            @click="previewInvoice()" 
                            type="button" 
                            class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-blue-600 dark:bg-blue-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            {{ t('invoices.show.preview_invoice') }}
                        </button>
                        
                        <!-- Rechnung ausstellen Button (nur wenn noch nicht ausgestellt) -->
                        <button 
                            v-if="!invoice?.issued_at" 
                            @click="issueInvoice()" 
                            type="button" 
                            class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-green-600 dark:bg-green-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 dark:hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                        >
                            {{ t('invoices.show.issue_invoice') }}
                        </button>
                        
                        <!-- Rechnung herunterladen Button (nur wenn ausgestellt) -->
                        <button 
                            v-if="invoice?.issued_at" 
                            @click="generateInvoicePDF()" 
                            type="button" 
                            class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-indigo-600 dark:bg-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            {{ t('invoices.show.download_invoice') }}
                        </button>
                        
                        <button 
                            v-if="invoice?.status === 'completed' && invoice?.issued_at" 
                            @click="generateInvoicePDF()" 
                            type="button" 
                            class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-indigo-600 dark:bg-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            {{ t('invoices.show.download_iveha') }}
                        </button>
                    </div>

                    <Menu as="div" class="relative inline-block text-left mt-2 w-full">
                        <div class="w-full">
                            <MenuButton class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                {{ t('invoices.show.options') }}
                            </MenuButton>
                        </div>

                        <transition
                            enter-active-class="transition ease-out duration-100"
                            enter-from-class="transform opacity-0 scale-95"
                            enter-to-class="transform opacity-100 scale-100"
                            leave-active-class="transition ease-in duration-75"
                            leave-from-class="transform opacity-100 scale-100"
                            leave-to-class="transform opacity-0 scale-95"
                        >
                            <div>
                                <MenuItems
                                    class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none"
                                >
                                    <div
                                        v-for="(status, key) in statuses"
                                        :key="key"
                                        @click="updateStatus(key)"
                                        class="py-1"
                                    >
                                        <MenuItem v-slot="{ active }">
                                            <a href="#" :class="[active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white outline-none' : 'text-gray-700 dark:text-gray-300', 'block px-4 py-2 text-sm']">{{ status }}</a>
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </div>
                        </transition>
                    </Menu>

                </div>
            </div>


            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mt-8">
                <div class="flex-1">
                    <div class="mt-8 lg:mt-16 text-gray-900 dark:text-white font-medium">{{ t('invoices.show.order_address') }}</div>
                    <div class="text-gray-700 dark:text-gray-300 text-sm">
                        <p>{{ invoice?.construction || 'Unbekannter Kunde' }}</p>
                        <p>{{ invoice?.address || 'Keine Adresse' }}</p>
                        <p>{{ invoice?.postal || '' }} {{ invoice?.city || '' }}</p>
                    </div>
                </div>

                <div class="flex-1 lg:ml-8">
                    <div class="mt-8 lg:mt-16 text-gray-900 dark:text-white font-medium">{{ t('invoices.show.order_details') }}</div>
                    <div class="text-gray-700 dark:text-gray-300 text-sm">
                        <p>{{ t('invoices.show.created_at') }}: {{ formattedDate }}</p>
                        <p>{{ t('invoices.show.order_number') }}: {{ invoice?.project_number || 'Keine Bezeichnung' }}</p>
                        <p class="underline">{{ t('invoices.show.invoice_number_label') }}: {{ invoice?.year || '0000' }}-{{ invoice?.order_number || '000000' }}</p>
                    </div>
                </div>

                <div class="flex-1 lg:max-w-md">
                    <h1 class="text-xl font-bold mt-8 lg:mt-16 text-gray-900 dark:text-white">{{ t('invoices.show.upload_file') }}</h1>

                    <FileUploader :invoice-id="invoice.id" />
                </div>
            </div>

            <PerformanceTable :order="invoice?.performances" :order_number="invoice?.order_number" :invoice="invoice" />

            <ChargeForm :invoice-id="invoice.id" :charges="invoice.charges || []" />

            <div class="mt-6">
                <h2 class="text-xl mt-4 text-gray-900 dark:text-white">{{ t('invoices.show.uploaded_files') }}</h2>
                <ul class="mt-4">
                    <li v-for="asset in invoice.assets" :key="asset.id" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-gray-200 dark:border-gray-700">
                        <a :href="'/storage/' + asset.file_path" target="_blank" class="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate text-sm">
                            {{ asset.file_name }}
                        </a>
                        <button @click="deleteFile(asset.id)" class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm self-start sm:self-auto">
                            ❌ {{ t('invoices.show.delete') }}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
