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
            backgroundColor: "bg-yellow-100",
            textColor: "text-yellow-800",
            ringColor: "ring-yellow-300",
        },
        completed: {
            text: "Abgeschlossen",
            backgroundColor: "bg-green-100",
            textColor: "text-green-800",
            ringColor: "ring-green-300",
        },
        pending: {
            text: "Wartend",
            backgroundColor: "bg-orange-100",
            textColor: "text-orange-800",
            ringColor: "ring-orange-300",
        },
        canceled: {
            text: "Abgebrochen",
            backgroundColor: "bg-red-100",
            textColor: "text-red-800",
            ringColor: "ring-red-300",
        },
        waiting_for_invoice: {
            text: "Warte auf Rechnung",
            backgroundColor: "bg-blue-100",
            textColor: "text-blue-800",
            ringColor: "ring-blue-300",
        },
        invoice_sent: {
            text: "Rechnung gesendet",
            backgroundColor: "bg-purple-100",
            textColor: "text-purple-800",
            ringColor: "ring-purple-300",
        },
    };

    return statusMapping[props.status] || {
        text: "Unbekannt",
        backgroundColor: "bg-gray-100",
        textColor: "text-gray-800",
        ringColor: "ring-gray-300",
    };
});
</script>
