<script setup>
import {computed, ref} from "vue";
import {
    Dialog,
    DialogPanel,
    TransitionChild,
    TransitionRoot,
} from "@headlessui/vue";
import dayjs from "dayjs";
import { ErrorMessage, Field, Form as VeeForm } from "vee-validate";
import * as yup from "yup";
import { usePerformanceStore } from "@/store/performanceStore";

const props = defineProps();

const open = ref(false);
const changeDate = ref(false);
const selectedDate = ref("");
const selectedPerformanceId = ref(null);
const dateTime = ref("");
const performanceStore = usePerformanceStore();
const performances = computed(() => Array.isArray(props.order) ? props.order : []);
console.log(props.order)

const schema = yup.object({
    qm: yup.string().required(),
    price: yup.string().required(),
    performance: yup.string().required(),
    flatrate: yup.boolean(),
});

const flatrateText = (flatrate) => (flatrate ? "Pauschal" : "Nicht pauschal");

const formatDateHours = (date) => dayjs(date).format("DD.MM.YYYY HH:mm");

const calculateTotalPrice = () => {
    if (!Array.isArray(performances.value)) return 0;

    return performances.value.reduce(
        (total, { qm, price, status, flatrate }) =>
            status !== "canceled"
                ? total + (flatrate ? price : qm * price)
                : total,
        0
    );
};


const getStatusBadge = (status) => {
    const statusMap = {
        canceled: { label: "Storniert", class: "bg-red-100 text-red-600" },
        date_change: { label: "Termin Verschoben", class: "bg-yellow-100 text-yellow-600" },
        no_change: { label: "Keine Veränderung", class: "bg-green-100 text-green-600" },
    };
    return statusMap[status] ?? { label: "Unbekannt", class: "bg-gray-100 text-gray-600" };
};

const handleDateChange = (event) => {
    const inputDate = event.target.value;
    dateTime.value = dayjs(inputDate).format("YYYY-MM-DDTHH:mm:ss");
};

const onSubmit = async (values) => {
    try {
        const newPerformance = await performanceStore.addPerformance(values, props.order_number, dateTime.value);
        if (newPerformance) {
            performances.value.push(newPerformance);
        }
        open.value = false;
    } catch (e) {
        console.error(e);
    }
};

const changeToCanceled = async (id) => {
    try {
        const updatedPerformance = await performanceStore.changePerformanceStatus(id, "canceled");
        const performance = performances.value.find((p) => p.id === id);
        if (performance) {
            performance.status = "canceled";
        }
    } catch (e) {
        console.error("Fehler beim Stornieren der Performance:", e);
    }
};

const deletePerformance = async (id) => {
    try {
        await performanceStore.deletePerformance(id);
        performances.value = performances.value.filter((p) => p.id !== id);
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
        const performance = performances.value.find((p) => p.id === id);
        if (performance) {
            performance.status = "no_change";
        }
    } catch (e) {
        console.error("Fehler beim Wiederherstellen der Performance:", e);
    }
};

const updateDateChange = async () => {
    try {
        if (selectedPerformanceId.value && selectedDate.value) {
            const formattedDate = dayjs(selectedDate.value).format("YYYY-MM-DD HH:mm:ss");

            const updatedPerformance = await performanceStore.changePerformanceDate(
                selectedPerformanceId.value,
                formattedDate,
                "date_change"
            );

            const performance = performances.value.find((p) => p.id === selectedPerformanceId.value);
            if (performance) {
                performance.date_change_to = formattedDate;
                performance.status = "date_change";
            }

            changeDate.value = false;
        }
    } catch (e) {
        console.error("Fehler beim Ändern des Datums:", e);
    }
};
</script>

<template>
    <div class="mt-10">
        <div class="sm:flex sm:items-center justify-end">
            <button
                type="button"
                @click="open = true"
                class="block rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-indigo-600"
            >
                Leistung Hinzufügen
            </button>
        </div>
        <div class="mt-8 flow-root">
            <div class="inline-block min-w-full py-2 align-middle">
                <div class="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-lg">
                    <table class="table-auto divide-y divide-gray-300">
                        <thead class="bg-gray-50">
                        <tr>
                            <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Leistung</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Datum</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quadratmeter</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Preis pro qm / Pauschal</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pauschal</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Preis</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Aktion</th>
                        </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                        <tr v-for="performance in performances" :key="performance?.invoice_id">
                            <td class="max-w-xs truncate whitespace-nowrap overflow-hidden py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {{ performance?.performance }}
                            </td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <div v-if="performance?.status === 'date_change'">
                                    <p>{{ formatDateHours(performance?.date_changed_to) }}</p>
                                    <p class="line-through text-red-600">{{ formatDateHours(performance?.date) }}</p>
                                </div>
                                <p v-else>{{ formatDateHours(performance?.date) }}</p>
                            </td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ performance.qm }} qm</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ performance.price }} €</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ flatrateText(performance.flatrate) }}</td>
                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <div v-if="!performance.flatrate">
                                    <p v-if="performance.status === 'canceled'" class="line-through">
                                        {{ (performance.qm * performance.price).toFixed(2) }} €
                                    </p>
                                    <p v-else>
                                        {{ (performance.qm * performance.price).toFixed(2) }} €
                                    </p>
                                </div>
                                <div v-else>
                                    <p v-if="performance.status === 'canceled'" class="line-through">
                                        {{ (performance.price).toFixed(2) }} €
                                    </p>
                                    <p v-else>
                                        {{ (performance.price).toFixed(2) }} €
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
                                        <svg class="w-4 h-4 text-red-600 hover:text-red-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                        </svg>
                                    </button>

                                    <button v-else @click="changeToNoChange(performance.id)">
                                        <!-- Button zum Wiederherstellen -->
                                        <svg class="w-4 h-4 text-green-600 hover:text-green-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <button @click="deletePerformance(performance.id)">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4 ml-2">
                                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <button @click="openChangeDateDialog(performance.id, performance.date_change_to || performance.date)">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4 ml-2">
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
        </div>
        <div class="mt-4 flex justify-end">
            <p class="text-base font-semibold text-gray-900">Gesamtsumme: {{ calculateTotalPrice().toFixed(2) }} €</p>
        </div>
        <TransitionRoot as="template" :show="changeDate">
            <Dialog class="relative z-50" @close="changeDate = false">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </TransitionChild>
                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <div>
                                    <div class="mt-3 text-center sm:mt-5">
                                        <h3 class="text-lg font-medium text-gray-900">Datum ändern</h3>
                                        <div class="mt-4">
                                            <input
                                                type="datetime-local"
                                                v-model="selectedDate"
                                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-5 sm:mt-6 flex justify-between">
                                    <button
                                        type="button"
                                        class="inline-flex w-1/2 justify-center rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                                        @click="changeDate = false"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="button"
                                        class="inline-flex w-1/2 justify-center ml-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        @click="updateDateChange"
                                    >
                                        Speichern
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
                    <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </TransitionChild>
                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <VeeForm v-slot="{ handleSubmit, values, errors }" :validation-schema="schema">
                                    <form @submit.prevent="handleSubmit(onSubmit)" class="space-y-6">
                                        <div class="flex">
                                            <div>
                                                <label for="qm" class="block text-sm font-medium text-gray-700">QM</label>
                                                <Field id="qm" name="qm" type="text" class="block w-full mt-1 border-2 border-gray-700/50 rounded-md p-1" />
                                                <ErrorMessage name="qm" class="mt-2 text-sm text-red-600" />
                                            </div>
                                            <div class="mx-2"></div>
                                            <div>
                                                <label for="price" class="block text-sm font-medium text-gray-700">Preis</label>
                                                <Field id="price" name="price" type="text" class="block w-full mt-1 border-2 border-gray-700/50 rounded-md p-1" />
                                                <ErrorMessage name="price" class="mt-2 text-sm text-red-600" />
                                            </div>
                                            <div class="mx-2"></div>
                                            <div class="w-full flex-row items-center justify-center">
                                                <label for="flatrate" class="flex justify-center block text-sm font-medium text-gray-700">Pauschal</label>
                                                <Field name="flatrate" :value="false">
                                                    <template #default="{ field }">
                                                        <div class="mt-1 flex justify-center items-center">
                                                            <Switch v-bind="field" v-model="flatrate" :class="[flatrate ? 'bg-indigo-600' : 'bg-gray-200', 'mt-1 w-11 relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2']">
                                                                <span class="sr-only">Use setting</span>
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
                                                    </template>
                                                </Field>
                                            </div>
                                        </div>
                                        <div>
                                            <label for="datetime" class="block text-sm font-medium text-gray-700">Datum und Uhrzeit</label>
                                            <input
                                                id="datetime"
                                                type="datetime-local"
                                                v-model="dateTime"
                                                @change="handleDateChange"
                                                class="block w-full mt-1 border-2 border-gray-700/50 rounded-md p-1"
                                            />
                                        </div>
                                        <div>
                                            <label for="performance" class="block text-sm font-medium text-gray-700">Leistung</label>
                                            <Field id="performance" name="performance" type="text" class="block w-full mt-1 border-2 border-gray-700/50 rounded-md p-1" />
                                            <ErrorMessage name="performance" class="mt-2 text-sm text-red-600" />
                                        </div>
                                        <div class="mt-5 sm:mt-6">
                                            <button type="submit" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                                                Termin Eintragen
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
