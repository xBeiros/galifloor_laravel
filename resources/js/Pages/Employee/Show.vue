<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import { defineProps, ref } from 'vue';

const props = defineProps({
    employee: Object
});
</script>

<template>
    <Head :title="`${employee.firstname} ${employee.lastname}`" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">
                Mitarbeiterprofil: {{ employee.firstname }} {{ employee.lastname }}
            </h2>
        </template>

        <div class="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="flex items-center space-x-6">
                    <img :src="employee.image_url" alt="Profilbild" class="w-32 h-32 object-cover rounded-full border" />
                    <div>
                        <h3 class="text-2xl font-bold">{{ employee.firstname }} {{ employee.lastname }}</h3>
                        <p class="text-gray-600">Geburtsdatum: {{ employee.date_of_birth }}</p>
                        <p class="text-sm text-gray-500">Status: {{ employee.status }}</p>
                        <p class="text-sm text-gray-500">Email: {{ employee.email }}</p>
                        <p class="text-sm text-gray-500">Telefon: {{ employee.phone }}</p>
                    </div>
                </div>
            </div>

            <div class="mt-8">
                <h4 class="text-lg font-semibold mb-4">Dokumente</h4>
                <ul class="space-y-2">
                    <li v-for="doc in employee.documents" :key="doc.id" class="flex justify-between items-center bg-gray-100 p-4 rounded">
                        <a :href="`/storage/${doc.file_path}`" class="text-blue-600 hover:underline" target="_blank">
                            {{ doc.original_name }}
                        </a>
                        <span class="text-xs text-gray-500">Hochgeladen am {{ doc.created_at }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
