<template>
    <Head :title="t('employee.index.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{{ t('employee.index.title') }}</h2>
        </template>

        <div class="mt-4 flex justify-between items-center">
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('employee.index.list') }}</h1>
            <button @click="open = true" class="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-500 dark:hover:bg-indigo-600">{{ t('employee.index.add') }}</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div
                v-for="employee in employees"
                :key="employee.id"
                @click="goToEmployee(employee.id)"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 cursor-pointer bg-white dark:bg-gray-800"
            >
                <img :src="employee.image_path || '/placeholder.jpg'" alt="Mitarbeiterfoto" class="w-full h-40 object-cover rounded" />
                <div class="mt-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ employee.first_name }} {{ employee.last_name }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('employee.index.birth_date') }}: {{ employee.birth_date }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('employee.index.status') }}: {{ statusMap[employee.status] }}</p>
                </div>
            </div>
        </div>

        <TransitionRoot as="template" :show="open">
            <Dialog as="div" class="relative z-10" @close="open = false">
                <div class="fixed inset-0 bg-black/50 dark:bg-gray-900/75" />
                <div class="fixed inset-0 flex items-center justify-center">
                    <DialogPanel class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg dark:shadow-gray-900 w-full max-w-md">
                        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{{ t('employee.index.modal.title') }}</h2>
                        <form @submit.prevent="submit">
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('employee.index.modal.first_name') }}</label>
                                <input v-model="form.first_name" type="text" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('employee.index.modal.last_name') }}</label>
                                <input v-model="form.last_name" type="text" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('employee.index.modal.birth_date') }}</label>
                                <input v-model="form.birth_date" type="date" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('employee.index.modal.status') }}</label>
                                <select v-model="form.status" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <option value="active">{{ t('employee.index.status_map.active') }}</option>
                                    <option value="fired">{{ t('employee.index.status_map.fired') }}</option>
                                    <option value="sick">{{ t('employee.index.status_map.sick') }}</option>
                                    <option value="vacation">{{ t('employee.index.status_map.vacation') }}</option>
                                </select>
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('employee.index.modal.photo') }}</label>
                                <input @change="handleImageUpload" type="file" accept="image/*" class="w-full text-sm text-gray-500 dark:text-gray-400 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300" />
                            </div>
                            <div class="flex justify-end">
                                <button type="button" @click="open = false" class="mr-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600">{{ t('employee.index.modal.cancel') }}</button>
                                <button type="submit" class="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-500 dark:hover:bg-indigo-600">{{ t('employee.index.modal.save') }}</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </TransitionRoot>
    </AuthenticatedLayout>
</template>

<script setup>
import { ref } from 'vue';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { useForm, router, Head } from '@inertiajs/vue3';
import { Dialog, DialogPanel, TransitionRoot } from '@headlessui/vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    employees: Array,
});

const open = ref(false);
const statusMap = {
    active: t('employee.index.status_map.active'),
    fired: t('employee.index.status_map.fired'),
    sick: t('employee.index.status_map.sick'),
    vacation: t('employee.index.status_map.vacation'),
};

const form = useForm({
    first_name: '',
    last_name: '',
    birth_date: '',
    status: 'active',
    image: null,
});

const handleImageUpload = (event) => {
    form.image = event.target.files[0];
};

const submit = () => {
    form.post('/employee', {
        forceFormData: true,
        onSuccess: () => {
            open.value = false;
            form.reset();
        },
    });
};

const goToEmployee = (id) => {
    router.visit(`/employee/${id}`);
};
</script>
