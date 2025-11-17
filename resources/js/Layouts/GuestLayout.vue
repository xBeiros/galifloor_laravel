<script setup lang="ts">
import ApplicationLogo from '@/Components/ApplicationLogo.vue';
import { Link } from '@inertiajs/vue3';
</script>

<template>
    <div
        class="flex min-h-screen flex-col items-center bg-gray-100 dark:bg-gray-900 pt-6 sm:justify-center sm:pt-0 px-4"
    >
        <div>
            <Link href="/">
                <ApplicationLogo class="h-16 w-16 sm:h-20 sm:w-20 fill-current text-gray-500 dark:text-gray-400" />
            </Link>
        </div>

        <div
            class="mt-6 w-full overflow-hidden bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 shadow-md dark:shadow-gray-900 sm:max-w-md sm:rounded-lg"
        >
            <slot />
        </div>
    </div>
</template>
