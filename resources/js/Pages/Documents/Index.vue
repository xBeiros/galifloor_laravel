<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm, router } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import { 
    DocumentIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon,
    ArrowDownTrayIcon,
    FolderIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline';
import { Dialog, DialogPanel, TransitionRoot } from '@headlessui/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
    documents: Array,
    groupedDocuments: Object
});

const showUploadModal = ref(false);
const showEditModal = ref(false);
const selectedDocument = ref(null);
const expandedCategories = ref({});

const categories = [
    { value: 'Soka-Bau', label: 'Soka-Bau' },
    { value: 'BG-Bau', label: 'BG-Bau' },
    { value: 'AOK', label: 'AOK' },
    { value: 'Knappschaft', label: 'Knappschaft' },
    { value: 'Vorlagen', label: 'Vorlagen' },
    { value: 'Sonstige', label: 'Sonstige' }
];

const form = useForm({
    name: '',
    category: 'Soka-Bau',
    description: '',
    file: null
});

const editForm = useForm({
    name: '',
    category: '',
    description: '',
    file: null
});

const toggleCategory = (category) => {
    expandedCategories.value[category] = !expandedCategories.value[category];
};

const isCategoryExpanded = (category) => {
    return expandedCategories.value[category] !== false; // Standardmäßig geöffnet
};

const openUploadModal = () => {
    form.reset();
    form.category = 'Soka-Bau';
    showUploadModal.value = true;
};

const openEditModal = (document) => {
    selectedDocument.value = document;
    editForm.name = document.name;
    editForm.category = document.category;
    editForm.description = document.description || '';
    editForm.file = null;
    showEditModal.value = true;
};

const closeModals = () => {
    showUploadModal.value = false;
    showEditModal.value = false;
    selectedDocument.value = null;
    form.reset();
    editForm.reset();
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        form.file = file;
    }
};

const handleEditFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        editForm.file = file;
    }
};

const submitUpload = () => {
    form.post(route('documents.store'), {
        forceFormData: true,
        onSuccess: () => {
            closeModals();
            router.reload({ only: ['documents', 'groupedDocuments'] });
        }
    });
};

const submitEdit = () => {
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('category', editForm.category);
    formData.append('description', editForm.description || '');
    if (editForm.file) {
        formData.append('file', editForm.file);
    }
    formData.append('_method', 'PUT');

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        formData.append('_token', csrfToken);
    }

    fetch(route('documents.update', selectedDocument.value.id), {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken || ''
        }
    })
    .then(() => {
        closeModals();
        router.reload({ only: ['documents', 'groupedDocuments'] });
    })
    .catch(error => {
        console.error('Update error:', error);
    });
};

const deleteDocument = (documentId) => {
    if (confirm(t('documents.confirm_delete'))) {
        const form = useForm({});
        form.delete(route('documents.destroy', documentId), {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['documents', 'groupedDocuments'] });
            }
        });
    }
};

const downloadDocument = (documentId) => {
    window.location.href = route('documents.download', documentId);
};

const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
        case 'pdf':
            return '📄';
        case 'doc':
        case 'docx':
            return '📝';
        case 'xls':
        case 'xlsx':
            return '📊';
        case 'jpg':
        case 'jpeg':
        case 'png':
            return '🖼️';
        default:
            return '📎';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};
</script>

<template>
    <Head :title="t('documents.index.title')" />
    <AuthenticatedLayout>
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    {{ t('documents.index.title') }}
                </h2>
                <button 
                    @click="openUploadModal"
                    class="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon class="h-5 w-5 mr-2" />
                    {{ t('documents.index.add_document') }}
                </button>
            </div>
        </template>

        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div v-if="Object.keys(groupedDocuments).length === 0" class="text-center py-12">
                <DocumentIcon class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p class="text-gray-500 dark:text-gray-400">{{ t('documents.index.no_documents') }}</p>
            </div>

            <div v-else class="space-y-6">
                <div 
                    v-for="(docs, category) in groupedDocuments" 
                    :key="category"
                    class="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900 rounded-lg overflow-hidden"
                >
                    <div 
                        class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 cursor-pointer"
                        @click="toggleCategory(category)"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <FolderIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ category }}</h3>
                                <span class="ml-3 px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                                    {{ docs.length }}
                                </span>
                            </div>
                            <svg 
                                :class="[
                                    'w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform',
                                    isCategoryExpanded(category) ? 'transform rotate-180' : ''
                                ]"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <div v-if="isCategoryExpanded(category)" class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div 
                                v-for="doc in docs" 
                                :key="doc.id"
                                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-shadow bg-white dark:bg-gray-800"
                            >
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                                        <span class="text-2xl flex-shrink-0">{{ getFileIcon(doc.original_name) }}</span>
                                        <div class="min-w-0 flex-1">
                                            <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ doc.name }}</h4>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ formatDate(doc.created_at) }}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <p v-if="doc.description" class="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                    {{ doc.description }}
                                </p>

                                <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        @click="downloadDocument(doc.id)"
                                        class="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                        :title="t('documents.index.download')"
                                    >
                                        <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                                        {{ t('documents.index.download') }}
                                    </button>
                                    <div class="flex items-center space-x-2">
                                        <button
                                            @click="openEditModal(doc)"
                                            class="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                            :title="t('documents.index.edit')"
                                        >
                                            <PencilIcon class="w-4 h-4" />
                                        </button>
                                        <button
                                            @click="deleteDocument(doc.id)"
                                            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                            :title="t('documents.index.delete')"
                                        >
                                            <TrashIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Modal -->
        <TransitionRoot as="template" :show="showUploadModal">
            <Dialog as="div" class="relative z-10" @close="closeModals">
                <div class="fixed inset-0 bg-black/50 dark:bg-gray-900/75" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 w-full max-w-md">
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    {{ t('documents.index.upload_modal.title') }}
                                </h3>
                                <button @click="closeModals" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                    <XMarkIcon class="w-6 h-6" />
                                </button>
                            </div>

                            <form @submit.prevent="submitUpload" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.name') }}
                                    </label>
                                    <input
                                        v-model="form.name"
                                        type="text"
                                        required
                                        class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.category') }}
                                    </label>
                                    <select
                                        v-model="form.category"
                                        required
                                        class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                                            {{ cat.label }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.description') }}
                                    </label>
                                    <textarea
                                        v-model="form.description"
                                        rows="3"
                                        class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.file') }}
                                    </label>
                                    <input
                                        @change="handleFileUpload"
                                        type="file"
                                        required
                                        class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
                                    />
                                </div>

                                <div class="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        @click="closeModals"
                                        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {{ t('common.cancel') }}
                                    </button>
                                    <button
                                        type="submit"
                                        :disabled="form.processing"
                                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
                                    >
                                        {{ t('common.save') }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Edit Modal -->
        <TransitionRoot as="template" :show="showEditModal">
            <Dialog as="div" class="relative z-10" @close="closeModals">
                <div class="fixed inset-0 bg-black/50 dark:bg-gray-900/75" />
                <div class="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900 w-full max-w-md">
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    {{ t('documents.index.edit_modal.title') }}
                                </h3>
                                <button @click="closeModals" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                                    <XMarkIcon class="w-6 h-6" />
                                </button>
                            </div>

                            <form @submit.prevent="submitEdit" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.name') }}
                                    </label>
                                    <input
                                        v-model="editForm.name"
                                        type="text"
                                        required
                                        class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.category') }}
                                    </label>
                                    <select
                                        v-model="editForm.category"
                                        required
                                        class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                                            {{ cat.label }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.upload_modal.description') }}
                                    </label>
                                    <textarea
                                        v-model="editForm.description"
                                        rows="3"
                                        class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {{ t('documents.index.edit_modal.new_file') }} ({{ t('common.optional') }})
                                    </label>
                                    <input
                                        @change="handleEditFileUpload"
                                        type="file"
                                        class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
                                    />
                                </div>

                                <div class="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        @click="closeModals"
                                        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        {{ t('common.cancel') }}
                                    </button>
                                    <button
                                        type="submit"
                                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                    >
                                        {{ t('common.save') }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </TransitionRoot>
    </AuthenticatedLayout>
</template>

