<template>
  <span
      :class="[
      'inline-flex items-center rounded-full px-[8px] py-[0.5px] text-[10px] font-medium ring-1 ring-inset',
      statusStyles.backgroundColor,
      statusStyles.textColor,
      statusStyles.ringColor,
    ]"
  >
    {{ statusStyles.text }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    status: {
        type: String,
        required: true,
        validator: value =>
            ["in_progress", "completed", "pending", "canceled", "waiting_for_invoice", "invoice_sent"].includes(value),
    },
});

const statusStyles = computed(() => {
    const statusMapping = {
        in_progress: {
            text: "In Bearbeitung",
            backgroundColor: "bg-yellow-100 dark:bg-yellow-900/30",
            textColor: "text-yellow-800 dark:text-yellow-300",
            ringColor: "ring-yellow-300 dark:ring-yellow-700",
        },
        completed: {
            text: "Abgeschlossen",
            backgroundColor: "bg-green-100 dark:bg-green-900/30",
            textColor: "text-green-800 dark:text-green-300",
            ringColor: "ring-green-300 dark:ring-green-700",
        },
        pending: {
            text: "Wartend",
            backgroundColor: "bg-orange-100 dark:bg-orange-900/30",
            textColor: "text-orange-800 dark:text-orange-300",
            ringColor: "ring-orange-300 dark:ring-orange-700",
        },
        canceled: {
            text: "Abgebrochen",
            backgroundColor: "bg-red-100 dark:bg-red-900/30",
            textColor: "text-red-800 dark:text-red-300",
            ringColor: "ring-red-300 dark:ring-red-700",
        },
        waiting_for_invoice: {
            text: "Warte auf Rechnung",
            backgroundColor: "bg-blue-100 dark:bg-blue-900/30",
            textColor: "text-blue-800 dark:text-blue-300",
            ringColor: "ring-blue-300 dark:ring-blue-700",
        },
        invoice_sent: {
            text: "Rechnung gesendet",
            backgroundColor: "bg-purple-100 dark:bg-purple-900/30",
            textColor: "text-purple-800 dark:text-purple-300",
            ringColor: "ring-purple-300 dark:ring-purple-700",
        },
    };

    return statusMapping[props.status] || {
        text: "Unbekannt",
        backgroundColor: "bg-gray-100 dark:bg-gray-800",
        textColor: "text-gray-800 dark:text-gray-300",
        ringColor: "ring-gray-300 dark:ring-gray-600",
    };
});
</script>
