<template>
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">Mitarbeiterverwaltung</h2>
        </template>

        <div class="mt-4 flex justify-between items-center">
            <h1 class="text-lg font-semibold">Mitarbeiterliste</h1>
            <button @click="open = true" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500">Mitarbeiter hinzufügen</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div
                v-for="employee in employees"
                :key="employee.id"
                @click="goToEmployee(employee.id)"
                class="border rounded-lg p-4 shadow hover:shadow-lg cursor-pointer"
            >
                {{employee}}
                <img :src="employee.image_path || '/placeholder.jpg'" alt="Mitarbeiterfoto" class="w-full h-40 object-cover rounded" />
                <div class="mt-4">
                    <h3 class="text-lg font-bold">{{ employee.first_name }} {{ employee.last_name }}</h3>
                    <p class="text-sm text-gray-600">Geburtsdatum: {{ employee.birth_date }}</p>
                    <p class="text-sm text-gray-600">Status: {{ statusMap[employee.status] }}</p>
                </div>
            </div>
        </div>

        <TransitionRoot as="template" :show="open">
            <Dialog as="div" class="relative z-10" @close="open = false">
                <div class="fixed inset-0 bg-black bg-opacity-50" />
                <div class="fixed inset-0 flex items-center justify-center">
                    <DialogPanel class="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h2 class="text-xl font-semibold mb-4">Neuer Mitarbeiter</h2>
                        <form @submit.prevent="submit">
                            <div class="mb-2">
                                <label>Vorname</label>
                                <input v-model="form.first_name" type="text" class="w-full border px-2 py-1 rounded" />
                            </div>
                            <div class="mb-2">
                                <label>Nachname</label>
                                <input v-model="form.last_name" type="text" class="w-full border px-2 py-1 rounded" />
                            </div>
                            <div class="mb-2">
                                <label>Geburtsdatum</label>
                                <input v-model="form.birth_date" type="date" class="w-full border px-2 py-1 rounded" />
                            </div>
                            <div class="mb-2">
                                <label>Status</label>
                                <select v-model="form.status" class="w-full border px-2 py-1 rounded">
                                    <option value="active">Aktiv</option>
                                    <option value="fired">Gekündigt</option>
                                    <option value="sick">Krank</option>
                                    <option value="vacation">Urlaub</option>
                                </select>
                            </div>
                            <div class="mb-2">
                                <label>Foto (optional)</label>
                                <input @change="handleImageUpload" type="file" accept="image/*" class="w-full" />
                            </div>
                            <div class="flex justify-end">
                                <button type="button" @click="open = false" class="mr-2 px-4 py-2 bg-gray-300 rounded">Abbrechen</button>
                                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded">Speichern</button>
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
import { useForm, router } from '@inertiajs/vue3';
import { Dialog, DialogPanel, TransitionRoot } from '@headlessui/vue';
import axios from 'axios';

const props = defineProps({
    employees: Array,
});

const open = ref(false);
const statusMap = {
    active: 'Aktiv',
    fired: 'Gekündigt',
    sick: 'Krank',
    vacation: 'Urlaub',
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
