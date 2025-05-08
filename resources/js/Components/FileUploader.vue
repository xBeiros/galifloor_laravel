<template>
    <div
        class="border-dashed border-2 border-gray-400 p-6 rounded-lg text-center"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="handleDrop"
        :class="{ 'bg-gray-200': dragging }"
    >
        <input type="file" ref="fileInput" multiple class="hidden" @change="handleFileSelect" />
        <p class="text-gray-700">
            Dateien hierhin ziehen oder
            <span class="text-blue-500 cursor-pointer" @click="selectFile">Dateien auswählen</span>
        </p>
        <ul class="mt-4">
            <li v-for="file in files" :key="file.name" class="text-sm text-gray-600">
                {{ file.name }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useForm } from "@inertiajs/vue3";

const props = defineProps({
    invoiceId: Number, // ID der Rechnung
});

const dragging = ref(false);
const files = ref([]);
const fileInput = ref(null);

const handleDrop = (event) => {
    dragging.value = false;
    uploadFiles(event.dataTransfer.files);
};

const handleFileSelect = (event) => {
    uploadFiles(event.target.files);
};

const selectFile = () => {
    fileInput.value.click();
};

const uploadFiles = (selectedFiles) => {
    Array.from(selectedFiles).forEach((file) => {
        files.value.push(file);

        const form = useForm({
            file,
            invoice_id: props.invoiceId,
        });

        form.post("/upload", {
            preserveScroll: true,
            onSuccess: () => {
                console.log("Datei hochgeladen:", file.name);
            },
        });
    });
};
</script>

<style scoped>
.border-dashed {
    border-style: dashed;
}
</style>
