<script setup lang="ts">
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DeleteUserForm from './Partials/DeleteUserForm.vue';
import UpdatePasswordForm from './Partials/UpdatePasswordForm.vue';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm.vue';
import { Head } from '@inertiajs/vue3';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
    mustVerifyEmail?: boolean;
    status?: string;
}>();
</script>

<template>
    <Head :title="t('profile.title')" />

    <AuthenticatedLayout>
        <template #header>
            <h2
                class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200"
            >
                {{ t('profile.title') }}
            </h2>
        </template>

        <div class="py-6 sm:py-12">
            <div class="mx-auto max-w-7xl space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
                <div
                    class="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 shadow dark:shadow-gray-900 sm:rounded-lg"
                >
                    <UpdateProfileInformationForm
                        :must-verify-email="mustVerifyEmail"
                        :status="status"
                        class="max-w-xl"
                    />
                </div>

                <div
                    class="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 shadow dark:shadow-gray-900 sm:rounded-lg"
                >
                    <UpdatePasswordForm class="max-w-xl" />
                </div>

                <div
                    class="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 shadow dark:shadow-gray-900 sm:rounded-lg"
                >
                    <DeleteUserForm class="max-w-xl" />
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
