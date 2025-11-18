<template>
    <Head :title="t('vehicle.index.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">{{ t('vehicle.index.title') }}</h2>
        </template>

        <div class="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('vehicle.index.list') }}</h1>
            <div class="flex items-center gap-3 w-full sm:w-auto">
                <!-- Suchfeld -->
                <div class="relative flex-1 sm:flex-initial sm:w-64">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        v-model="searchQuery"
                        type="text"
                        :placeholder="t('vehicle.index.search_placeholder')"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button @click="open = true" class="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-500 dark:hover:bg-indigo-600 whitespace-nowrap">{{ t('vehicle.index.add') }}</button>
            </div>
        </div>

        <div v-if="filteredVehicles.length === 0" class="mt-6 text-center py-12">
            <p class="text-gray-500 dark:text-gray-400">{{ t('vehicle.index.no_results') }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div
                v-for="vehicle in filteredVehicles"
                :key="vehicle.id"
                @click="goToVehicle(vehicle.id)"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow dark:shadow-gray-900 hover:shadow-lg dark:hover:shadow-gray-800 cursor-pointer bg-white dark:bg-gray-800"
            >
                <img :src="vehicle.image_url || vehicle.image_path || '/images/default-user.png'" alt="Fahrzeugbild" class="w-full h-40 object-cover rounded" />
                <div class="mt-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ vehicle.license_plate }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('vehicle.vehicle_identification_number') }}: {{ vehicle.vehicle_identification_number }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ t('vehicle.status') }}: {{ statusMap[vehicle.status] }}</p>
                </div>
            </div>
        </div>

        <TransitionRoot as="template" :show="open">
            <Dialog as="div" class="relative z-10" @close="open = false">
                <div class="fixed inset-0 bg-black/50 dark:bg-gray-900/75" />
                <div class="fixed inset-0 flex items-center justify-center">
                    <DialogPanel class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg dark:shadow-gray-900 w-full max-w-md">
                        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{{ t('vehicle.index.modal.title') }}</h2>
                        <form @submit.prevent="submit">
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.license_plate') }}</label>
                                <input v-model="form.license_plate" type="text" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.vehicle_identification_number') }}</label>
                                <input v-model="form.vehicle_identification_number" type="text" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.status') }}</label>
                                <select v-model="form.status" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <option value="registered">{{ t('vehicle.status_map.registered') }}</option>
                                    <option value="unregistered">{{ t('vehicle.status_map.unregistered') }}</option>
                                    <option value="sold">{{ t('vehicle.status_map.sold') }}</option>
                                </select>
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.notes') }}</label>
                                <textarea v-model="form.notes" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3"></textarea>
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('vehicle.index.modal.image') }}</label>
                                <input @change="handleImageUpload" type="file" accept="image/*" class="w-full text-sm text-gray-500 dark:text-gray-400 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300" />
                            </div>
                            <div class="flex justify-end">
                                <button type="button" @click="open = false" class="mr-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600">{{ t('vehicle.index.modal.cancel') }}</button>
                                <button type="submit" class="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-500 dark:hover:bg-indigo-600">{{ t('vehicle.index.modal.save') }}</button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </TransitionRoot>
    </AuthenticatedLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { useForm, router, Head } from '@inertiajs/vue3';
import { Dialog, DialogPanel, TransitionRoot } from '@headlessui/vue';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    vehicles: Array,
});

const open = ref(false);
const searchQuery = ref('');

const statusMap = {
    registered: t('vehicle.status_map.registered'),
    unregistered: t('vehicle.status_map.unregistered'),
    sold: t('vehicle.status_map.sold'),
};

const filteredVehicles = computed(() => {
    if (!searchQuery.value.trim()) {
        return props.vehicles;
    }
    
    const query = searchQuery.value.toLowerCase().trim();
    return props.vehicles.filter(vehicle => {
        return (
            vehicle.license_plate?.toLowerCase().includes(query) ||
            vehicle.vehicle_identification_number?.toLowerCase().includes(query) ||
            vehicle.notes?.toLowerCase().includes(query) ||
            statusMap[vehicle.status]?.toLowerCase().includes(query)
        );
    });
});

const form = useForm({
    license_plate: '',
    vehicle_identification_number: '',
    status: 'registered',
    notes: '',
    image: null,
});

const handleImageUpload = (event) => {
    form.image = event.target.files[0];
};

const submit = () => {
    form.post('/vehicles', {
        forceFormData: true,
        onSuccess: () => {
            open.value = false;
            form.reset();
        },
    });
};

const goToVehicle = (id) => {
    router.visit(`/vehicle/${id}`);
};
</script>
