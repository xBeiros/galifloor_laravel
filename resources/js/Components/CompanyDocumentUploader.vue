<template>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-900">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{{ t('company.show.upload_document') }}</h3>

        <form @submit.prevent="uploadDocument" class="space-y-4">
            <div>
                <label for="file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('common.select_file') }}
                </label>
                <input
                    id="file"
                    ref="fileInput"
                    type="file"
                    @change="handleFileSelect"
                    class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ t('common.allowed_formats') }}
                </p>
            </div>

            <div v-if="selectedFile" class="flex items-center space-x-2">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ selectedFile.name }}</span>
                <span class="text-xs text-gray-400">({{ formatFileSize(selectedFile.size) }})</span>
            </div>

            <div class="flex space-x-3">
                <button
                    type="submit"
                    :disabled="!selectedFile || uploading"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg v-if="uploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ uploading ? t('common.uploading') : t('common.upload_document') }}
                </button>

                <button
                    type="button"
                    @click="clearFile"
                    :disabled="!selectedFile || uploading"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {{ t('common.cancel') }}
                </button>
            </div>
        </form>

        <!-- Erfolgs-/Fehlermeldungen -->
        <div v-if="message" class="mt-4">
            <div v-if="messageType === 'success'" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
                {{ message }}
            </div>
            <div v-else-if="messageType === 'error'" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                {{ message }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    companyId: String | Number,
});

const fileInput = ref(null);
const selectedFile = ref(null);
const uploading = ref(false);
const message = ref('');
const messageType = ref('');

const handleFileSelect = (event) => {
    const target = event.target;
    const file = target.files ? target.files[0] : null;
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            showMessage(t('common.file_too_large'), 'error');
            return;
        }
        selectedFile.value = file;
        message.value = '';
    }
};

const clearFile = () => {
    selectedFile.value = null;
    if (fileInput.value) {
        fileInput.value.value = '';
    }
    message.value = '';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const uploadDocument = () => {
    if (!selectedFile.value) return;

    uploading.value = true;
    message.value = '';

    const form = useForm({
        file: selectedFile.value
    });

    form.post(route('company.upload-document', props.companyId), {
        preserveScroll: true,
        onSuccess: () => {
            showMessage(t('common.document_uploaded_success'), 'success');
            clearFile();
        },
        onError: (errors) => {
            const errorMessage = errors.file || t('common.document_upload_error');
            showMessage(errorMessage, 'error');
        },
        onFinish: () => {
            uploading.value = false;
        }
    });
};

const showMessage = (text, type) => {
    message.value = text;
    messageType.value = type;
    setTimeout(() => {
        message.value = '';
        messageType.value = '';
    }, 5000);
};
</script>

