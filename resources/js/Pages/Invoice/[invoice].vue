<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import { defineProps, computed, ref } from 'vue';
import { MenuButton, MenuItem, MenuItems, Menu } from '@headlessui/vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import PerformanceTable from '@/Components/PerformanceTable.vue';
import dayjs from 'dayjs';
import { generateInvoice } from '@/Composables/generateInvoicePDF';
import FileUploader from '@/Components/FileUploader.vue';
import { generateInvoiceAndSend } from '@/Composables/generateAndSendInvoicePDF';

const props = defineProps({
    invoice: Object, // Wird über Inertia von Laravel übergeben
});

const formattedDate = computed(() => {
    return props.invoice?.updated_at
        ? dayjs(props.invoice.updated_at).format('DD.MM.YYYY')
        : 'Unbekanntes Datum';
});

const statuses = {
    in_progress: 'In Bearbeitung',
    waiting_for_invoice: 'Wartet auf Rechnung',
    invoice_sent: 'Rechnung Verschickt',
    completed: 'Abgeschlossen',
    canceled: 'Storniert',
};

const selectedStatus = ref('');
const isOpen = ref(false);

function toggleDropdown() {
    isOpen.value = !isOpen.value;
}

const generateInvoicePDF = () => {
    console.log(props.invoice);
    generateInvoice(props.invoice);
};

const sendInvoice = () => {
    generateInvoiceAndSend(props.invoice);
};

const deleteFile = (fileId) => {
    if (confirm('Möchtest du diese Datei wirklich löschen?')) {
        const form = useForm({});

        form.delete(`/assets/${fileId}`, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Datei gelöscht:', fileId);
            },
        });
    }
};
</script>


<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>
        <template #header>
            <h2
                class="text-xl font-semibold leading-tight text-gray-800"
            >
                Auftrag: {{ invoice.year }}-{{ invoice.order_number }}
            </h2>
        </template>

        <div>
            <div class="flex items-center justify-between">
                <!-- Linker Teil: Firmenlogo und Informationen -->
                <div class="flex">
                    <div>
                        <img :src="`${asset}/${invoice?.company?.image_url || 'default-logo.png'}`" alt="Company Logo" class="h-16 w-16 object-contain">
                    </div>

                    <div class="ml-4">
                        <div>
                            <div class="flex">
                                <div class="font-bold">{{ invoice?.company?.name || 'Unbekanntes Unternehmen' }}</div>
                                <StatusBadge class="ml-3" :status="invoice?.status || 'unknown'" />
                            </div>
                            <p>{{ invoice?.company?.address || 'Keine Adresse' }}</p>
                            <p>{{ invoice?.company?.postal || '' }} {{ invoice?.company?.city || '' }}</p>
                        </div>
                    </div>
                </div>

                <div class="w-60">
                    <div class="w-full">
                        <button @click="sendInvoice()" type="button" class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                            Rechnung Senden
                        </button>
                        <button v-if="invoice.invoice_send" @click="generateInvoicePDF()" type="button" class="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                            Rechnung Herunterladen
                        </button>
                        <button v-if="invoice?.order_send" @click="generateInvoicePDF()" type="button" class="mt-1 inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                            IVEHA Auftrag Herunterladen
                        </button>
                    </div>

                    <Menu as="div" class="relative inline-block text-left mt-2 w-full">
                        <div class="w-full">
                            <MenuButton class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                Options
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
                                    class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                                >
                                    <div
                                        v-for="(status, key) in statuses"
                                        :key="key"
                                        @click="updateStatus(key)"
                                        class="py-1"
                                    >
                                        <MenuItem v-slot="{ active }">
                                            <a href="#" :class="[active ? 'bg-gray-100 text-gray-900 outline-none' : 'text-gray-700', 'block px-4 py-2 text-sm']">{{ status }}</a>
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </div>
                        </transition>
                    </Menu>

                </div>
            </div>


            <div class="flex items-center justify-between mt-8">
                <div class="">
                    <div class="mt-16">Auftragsadresse:</div>
                    <div>
                        <p>{{ invoice?.construction || 'Unbekannter Kunde' }}</p>
                        <p>{{ invoice?.address || 'Keine Adresse' }}</p>
                        <p>{{ invoice?.postal || '' }} {{ order?.city || '' }}</p>
                    </div>
                </div>

                <div class=" ml-32">
                    <div class="mt-16">Auftragsdetails:</div>
                    <div>
                        <p>Erstellt am: {{ formattedDate }}</p>
                        <p>Auftragsnummer: {{ invoice?.project_number || 'Keine Bezeichnung' }}</p>
                        <p class="underline">Rechnungsnummer: {{ invoice?.year || '0000' }}-{{ invoice?.order_number || '000000' }}</p>
                    </div>
                </div>

                <div>
                    <h1 class="text-xl font-bold mt-16">Datei Hochladen</h1>

                    <FileUploader :invoice-id="invoice.id" />
                </div>
            </div>

            <PerformanceTable :order="invoice?.performances" :order_number="invoice?.order_number" />

            <div>
                <h2 class="text-xl mt-4">Hochgeladene Dateien:</h2>
                <ul>
                    <li v-for="asset in invoice.assets" :key="asset.id" class="flex items-center justify-between">
                        <a :href="'/storage/' + asset.file_path" target="_blank" class="text-blue-500">
                            {{ asset.file_name }}
                        </a>
                        <button @click="deleteFile(asset.id)" class="text-red-500 hover:text-red-700 ml-2">
                            ❌ Löschen
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
