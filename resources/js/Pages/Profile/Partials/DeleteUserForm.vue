<script setup lang="ts">
import DangerButton from '@/Components/DangerButton.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import Modal from '@/Components/Modal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import { useForm } from '@inertiajs/vue3';
import { nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const confirmingUserDeletion = ref(false);
const passwordInput = ref<HTMLInputElement | null>(null);

const form = useForm({
    password: '',
});

const confirmUserDeletion = () => {
    confirmingUserDeletion.value = true;

    nextTick(() => passwordInput.value?.focus());
};

const deleteUser = () => {
    form.delete(route('profile.destroy'), {
        preserveScroll: true,
        onSuccess: () => closeModal(),
        onError: () => passwordInput.value?.focus(),
        onFinish: () => {
            form.reset();
        },
    });
};

const closeModal = () => {
    confirmingUserDeletion.value = false;

    form.clearErrors();
    form.reset();
};
</script>

<template>
    <section class="space-y-6">
        <header>
            <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {{ t('profile.delete_account.title') }}
            </h2>

            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ t('profile.delete_account.description') }}
            </p>
        </header>

        <DangerButton @click="confirmUserDeletion">{{ t('profile.delete_account.button') }}</DangerButton>

        <Modal :show="confirmingUserDeletion" @close="closeModal">
            <div class="p-4 sm:p-6">
                <h2
                    class="text-base sm:text-lg font-medium text-gray-900 dark:text-white"
                >
                    {{ t('profile.delete_account.confirm_title') }}
                </h2>

                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {{ t('profile.delete_account.confirm_description') }}
                </p>

                <div class="mt-6">
                    <InputLabel
                        for="password"
                        :value="t('profile.delete_account.password')"
                        class="sr-only"
                    />

                    <TextInput
                        id="password"
                        ref="passwordInput"
                        v-model="form.password"
                        type="password"
                        class="mt-1 block w-full sm:w-3/4"
                        :placeholder="t('profile.delete_account.password')"
                        @keyup.enter="deleteUser"
                    />

                    <InputError :message="form.errors.password" class="mt-2" />
                </div>

                <div class="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                    <SecondaryButton @click="closeModal">
                        {{ t('profile.delete_account.cancel') }}
                    </SecondaryButton>

                    <DangerButton
                        class="sm:ms-3"
                        :class="{ 'opacity-25': form.processing }"
                        :disabled="form.processing"
                        @click="deleteUser"
                    >
                        {{ t('profile.delete_account.delete') }}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    </section>
</template>
