<script setup>
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.vue";
import { PlusIcon } from "@heroicons/vue/24/outline";
import {
    Dialog,
    DialogOverlay,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
} from "@headlessui/vue";
import { ErrorMessage, Field, Form as VeeForm } from "vee-validate";
import * as yup from "yup";
import { onMounted, ref } from "vue";
import axios from "axios";
import { useI18n } from 'vue-i18n';
import { Head } from '@inertiajs/vue3';

const { t } = useI18n();

const open = ref(false);
const companies = ref([]);
const imageFile = ref(null);

const schema = yup.object({
    name: yup.string().required(),
    address: yup.string().required(),
    city: yup.string().required(),
    postal: yup.string().required(),
    email: yup.string().email().required(),
    security_service: yup.number().min(0).default(0),
    cash_discount: yup.number().min(0).default(0),
});

const fetchCompanies = async () => {
    try {
        const response = await axios.get("/api/companies");
        companies.value = response.data;
    } catch (error) {
        console.error("Fehler beim Laden der Unternehmen:", error);
    }
};

const editMode = ref(false);
const selectedCompany = ref(null);

const openEditModal = (company) => {
    selectedCompany.value = { ...company }; // Clone to prevent binding
    open.value = true;
    editMode.value = true;
};

const onSubmit = async (values) => {
    try {
        const formData = new FormData();
        for (const key in values) {
            formData.append(key, values[key]);
        }
        if (imageFile.value) {
            formData.append("image", imageFile.value);
        }

        if (editMode.value && selectedCompany.value) {
            await axios.post(`/api/companies/${selectedCompany.value.id}?_method=PUT`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        } else {
            await axios.post("/api/companies", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }

        await fetchCompanies();
        open.value = false;
        editMode.value = false;
        selectedCompany.value = null;
        imageFile.value = null;
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
    }
};

onMounted(fetchCompanies);
</script>

<template>
    <Head :title="t('company.index.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">{{ t('company.index.title') }}</h2>
        </template>

        <div class="sm:flex sm:items-center mt-4">
            <div class="sm:flex-auto">
                <h1 class="text-base font-semibold text-gray-900 dark:text-white">{{ t('company.index.companies') }}</h1>
                <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">{{ t('company.index.description') }}</p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button @click="open = true" type="button" class="flex items-center rounded-md bg-indigo-600 dark:bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-600">
                    <PlusIcon class="h-5 w-5 mr-1" /> {{ t('company.index.add_company') }}
                </button>
            </div>
        </div>

        <div class="mt-6 overflow-x-auto">
            <!-- Desktop Table View -->
            <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700 hidden md:table">
                <thead>
                <tr class="bg-gray-50 dark:bg-gray-800">
                    <th class="text-left py-2 text-sm font-semibold text-gray-900 dark:text-white">{{ t('company.index.logo') }}</th>
                    <th class="text-left py-2 text-sm font-semibold text-gray-900 dark:text-white">{{ t('company.index.name') }}</th>
                    <th class="text-left py-2 text-sm font-semibold text-gray-900 dark:text-white">{{ t('company.index.address') }}</th>
                    <th class="text-left py-2 text-sm font-semibold text-gray-900 dark:text-white">{{ t('company.index.location') }}</th>
                    <th class="text-left py-2 text-sm font-semibold text-gray-900 dark:text-white">{{ t('company.index.email') }}</th>
                    <th class="text-left py-2 text-sm font-semibold text-gray-900 dark:text-white">{{ t('company.index.actions') }}</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <tr v-for="company in companies" :key="company.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="py-2">
                        <img v-if="company.image_url" :src="company.image_url" class="h-10 w-10 rounded-full object-cover" />
                    </td>
                    <td class="py-2 text-sm text-gray-900 dark:text-white">{{ company.name }}</td>
                    <td class="py-2 text-sm text-gray-700 dark:text-gray-300">{{ company.address }}</td>
                    <td class="py-2 text-sm text-gray-700 dark:text-gray-300">{{ company.postal }} {{ company.city }}</td>
                    <td class="py-2 text-sm text-gray-700 dark:text-gray-300">{{ company.email }}</td>
                    <td class="py-2">
                        <button @click="openEditModal(company)" class="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">{{ t('company.index.edit') }}</button>
                    </td>
                </tr>
                </tbody>
            </table>
            
            <!-- Mobile Card View -->
            <div class="md:hidden space-y-4">
                <div v-for="company in companies" :key="company.id" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-start space-x-4">
                        <img v-if="company.image_url" :src="company.image_url" class="h-12 w-12 rounded-full object-cover flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">{{ company.name }}</h3>
                            <div class="space-y-1 text-sm">
                                <p class="text-gray-700 dark:text-gray-300">
                                    <span class="font-medium">{{ t('company.index.address') }}:</span> {{ company.address }}
                                </p>
                                <p class="text-gray-700 dark:text-gray-300">
                                    <span class="font-medium">{{ t('company.index.location') }}:</span> {{ company.postal }} {{ company.city }}
                                </p>
                                <p class="text-gray-700 dark:text-gray-300">
                                    <span class="font-medium">{{ t('company.index.email') }}:</span> {{ company.email }}
                                </p>
                            </div>
                            <button @click="openEditModal(company)" class="mt-3 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
                                {{ t('company.index.edit') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <TransitionRoot as="template" :show="open" style="z-index: 9999;">
            <Dialog class="relative z-10" @close="open = false">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity" />
                </TransitionChild>

                <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl dark:shadow-gray-900 transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <VeeForm
                                    :validation-schema="schema"
                                    :initial-values="selectedCompany ?? {
                                    name: '',
                                    address: '',
                                    city: '',
                                    postal: '',
                                    email: '',
                                    security_service: 0,
                                    cash_discount: 0,
                                  }"
                                    v-slot="{ handleSubmit, isSubmitting }"
                                >                                    <form @submit.prevent="handleSubmit(onSubmit)" class="space-y-4">
                                        <div>
                                            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.name') }}</label>
                                            <Field name="name" type="text" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="name" class="text-sm text-red-600 dark:text-red-400" />
                                        </div>

                                        <div>
                                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.email') }}</label>
                                            <Field name="email" type="email" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="email" class="text-sm text-red-600 dark:text-red-400" />
                                        </div>

                                        <div>
                                            <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.address') }}</label>
                                            <Field name="address" type="text" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            <ErrorMessage name="address" class="text-sm text-red-600 dark:text-red-400" />
                                        </div>

                                        <div class="flex gap-4">
                                            <div class="w-1/2">
                                                <label for="postal" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.postal') }}</label>
                                                <Field name="postal" type="text" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                <ErrorMessage name="postal" class="text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                            <div class="w-1/2">
                                                <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.city') }}</label>
                                                <Field name="city" type="text" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                <ErrorMessage name="city" class="text-sm text-red-600 dark:text-red-400" />
                                            </div>
                                        </div>

                                        <div class="flex gap-4">
                                            <div class="w-1/2">
                                                <label for="security_service" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.security_service') }}</label>
                                                <Field name="security_service" type="number" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            </div>
                                            <div class="w-1/2">
                                                <label for="cash_discount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.cash_discount') }}</label>
                                                <Field name="cash_discount" type="number" class="block w-full border rounded p-1.5 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('company.index.modal.profile_image') }}</label>
                                            <input type="file" @change="e => imageFile = e.target.files[0]" class="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300" />
                                        </div>

                                        <div>
                                            <button :disabled="isSubmitting" type="submit" class="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded">
                                                {{ t('company.index.modal.save') }}
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
