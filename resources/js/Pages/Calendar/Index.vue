<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, router } from '@inertiajs/vue3';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import { Link } from '@inertiajs/vue3';

const { t } = useI18n();

const props = defineProps({
    invoices: Array,
    currentYear: Number,
    currentMonth: Number,
});

const currentDate = ref(new Date(props.currentYear, props.currentMonth - 1, 1));

const monthNames = computed(() => [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december'),
]);

const dayNames = computed(() => [
    t('calendar.days.monday'),
    t('calendar.days.tuesday'),
    t('calendar.days.wednesday'),
    t('calendar.days.thursday'),
    t('calendar.days.friday'),
    t('calendar.days.saturday'),
    t('calendar.days.sunday'),
]);

// Hilfsfunktionen
const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return (firstDay.getDay() + 6) % 7; // Montag = 0
};

const isWeekend = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6; // Sonntag = 0, Samstag = 6
};

const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const calendarDays = computed(() => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate.value);
    const firstDay = getFirstDayOfMonth(currentDate.value);
    
    // Leere Tage am Anfang
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    
    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), day);
        days.push(date);
    }
    
    return days;
});

// Konvertiert ein Datum zu YYYY-MM-DD
const formatDateKey = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Vergleicht zwei Datums-Strings (YYYY-MM-DD)
const compareDates = (dateStr1, dateStr2) => {
    if (dateStr1 === dateStr2) return 0;
    return dateStr1 < dateStr2 ? -1 : 1;
};

// Prüft ob ein Datum zwischen zwei anderen liegt (inklusive)
const isDateInRange = (dateStr, startStr, endStr) => {
    return compareDates(dateStr, startStr) >= 0 && compareDates(dateStr, endStr) <= 0;
};

// Erstellt einen eindeutigen Event-Key
const getEventKey = (invoiceId, performanceId = null) => {
    if (performanceId !== null) {
        return `invoice-${invoiceId}-perf-${performanceId}`;
    }
    return `invoice-${invoiceId}`;
};

// Erstellt ein Event-Objekt
const createEvent = (invoice, performance = null) => {
    // Berechne Start- und Enddatum
    let startDate = null;
    let endDate = null;
    
    if (performance) {
        startDate = new Date(performance.date);
        endDate = performance.end_date ? new Date(performance.end_date) : null;
    } else if (invoice.start_date) {
        startDate = new Date(invoice.start_date);
        endDate = invoice.end_date ? new Date(invoice.end_date) : null;
    }
    
    // Prüfe ob es ein Multi-Day Event ist
    const isMultiDay = !!(performance?.end_date || (invoice.start_date && invoice.end_date && invoice.start_date !== invoice.end_date));
    
    return {
        id: invoice.id,
        invoiceId: invoice.id,
        performanceId: performance?.id || null,
        invoice_number: invoice.invoice_number || '',
        company_name: invoice.company_name || '',
        construction: invoice.construction || '',
        city: invoice.city || '',
        status: invoice.status,
        color: getInvoiceColor(invoice.status),
        performance: performance,
        startDate: startDate,
        endDate: endDate,
        isMultiDay: isMultiDay,
    };
};

// Findet alle Events für ein bestimmtes Datum
const getEventsForDate = (date) => {
    if (!date || isWeekend(date)) return [];
    
    const dateStr = formatDateKey(date);
    const events = [];
    const seenKeys = new Set();
    
    props.invoices.forEach(invoice => {
        // Prüfe zuerst Performances (höchste Priorität)
        if (invoice.performances && invoice.performances.length > 0) {
            invoice.performances.forEach(performance => {
                const perfStartDate = new Date(performance.date);
                const perfStartStr = formatDateKey(perfStartDate);
                const perfEndDate = performance.end_date ? new Date(performance.end_date) : null;
                const perfEndStr = perfEndDate ? formatDateKey(perfEndDate) : null;
                
                // Einzelnes Datum ohne Enddatum
                if (!perfEndStr && perfStartStr === dateStr) {
                    const key = getEventKey(invoice.id, performance.id);
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        events.push(createEvent(invoice, performance));
                    }
                    return;
                }
                
                // Datumsbereich: Prüfe ob aktuelles Datum im Bereich liegt
                if (perfEndStr && isDateInRange(dateStr, perfStartStr, perfEndStr)) {
                    const key = getEventKey(invoice.id, performance.id);
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        events.push(createEvent(invoice, performance));
                    }
                }
            });
        } else {
            // Fallback: Verwende Invoice start_date/end_date wenn keine Performances vorhanden
            if (invoice.start_date && invoice.end_date) {
                const invoiceStartStr = formatDateKey(new Date(invoice.start_date));
                const invoiceEndStr = formatDateKey(new Date(invoice.end_date));
                
                if (isDateInRange(dateStr, invoiceStartStr, invoiceEndStr)) {
                    const key = getEventKey(invoice.id);
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        events.push(createEvent(invoice));
                    }
                }
            } else if (invoice.start_date) {
                const invoiceStartStr = formatDateKey(new Date(invoice.start_date));
                if (invoiceStartStr === dateStr) {
                    const key = getEventKey(invoice.id);
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        events.push(createEvent(invoice));
                    }
                }
            }
        }
    });
    
    // Sortiere Events: Multi-Day zuerst, dann nach Invoice-Nummer
    events.sort((a, b) => {
        if (a.isMultiDay && !b.isMultiDay) return -1;
        if (!a.isMultiDay && b.isMultiDay) return 1;
        return (a.invoice_number || '').localeCompare(b.invoice_number || '');
    });
    
    return events;
};

// Berechnet die Lane-Nummer für ein Event an einem bestimmten Datum
const getEventLane = (event, date) => {
    const dateStr = formatDateKey(date);
    const allEvents = getEventsForDate(date);
    
    // Finde die Position dieses Events in der sortierten Liste
    const eventKey = getEventKey(event.invoiceId, event.performanceId);
    let lane = 0;
    
    for (const e of allEvents) {
        const eKey = getEventKey(e.invoiceId, e.performanceId);
        if (eKey === eventKey) {
            return lane;
        }
        lane++;
    }
    
    return 0;
};

// Prüft ob ein Event an einem bestimmten Datum startet
const isEventStartDate = (event, date) => {
    if (!event.startDate) return false;
    const dateStr = formatDateKey(date);
    const startStr = formatDateKey(event.startDate);
    return dateStr === startStr;
};

// Prüft ob ein Event an einem bestimmten Datum endet
const isEventEndDate = (event, date) => {
    if (!event.endDate) return false;
    const dateStr = formatDateKey(date);
    const endStr = formatDateKey(event.endDate);
    return dateStr === endStr;
};

// Prüft ob ein Event an einem bestimmten Datum in der Mitte ist (nicht Start, nicht Ende)
const isEventMiddleDate = (event, date) => {
    if (!event.isMultiDay) return false;
    return !isEventStartDate(event, date) && !isEventEndDate(event, date) && 
           isDateInRange(formatDateKey(date), formatDateKey(event.startDate), formatDateKey(event.endDate));
};

// Farben für Status
const getInvoiceColor = (status) => {
    const colors = {
        'in_progress': 'bg-gradient-to-r from-yellow-50 to-yellow-50/50 dark:from-yellow-900/20 dark:to-yellow-900/10 border-l-[3px] border-yellow-500 shadow-sm dark:shadow-yellow-900/20',
        'waiting_for_invoice': 'bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-900/10 border-l-[3px] border-orange-500 shadow-sm dark:shadow-orange-900/20',
        'invoice_sent': 'bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 border-l-[3px] border-blue-500 shadow-sm dark:shadow-blue-900/20',
        'completed': 'bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-900/20 dark:to-green-900/10 border-l-[3px] border-green-500 shadow-sm dark:shadow-green-900/20',
        'canceled': 'bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border-l-[3px] border-red-500 shadow-sm dark:shadow-red-900/20',
    };
    return colors[status] || 'bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-700/30 dark:to-gray-700/10 border-l-[3px] border-gray-400 shadow-sm';
};

// Navigation
const navigateMonth = (direction) => {
    const newDate = new Date(currentDate.value);
    newDate.setMonth(newDate.getMonth() + direction);
    currentDate.value = newDate;
    
    router.visit(route('calendar', {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1,
    }), {
        preserveState: true,
        preserveScroll: true,
    });
};

const goToToday = () => {
    const today = new Date();
    currentDate.value = today;
    
    router.visit(route('calendar', {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
    }), {
        preserveState: true,
        preserveScroll: true,
    });
};

// Event-Höhe und Abstand
const EVENT_HEIGHT = 22;
const EVENT_SPACING = 2;

// Hole den Ort für ein Event
const getEventLocation = (event) => {
    return event.construction || event.city || '';
};
</script>

<template>
    <Head :title="t('calendar.title')" />
    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                {{ t('calendar.title') }}
            </h2>
        </template>

        <div class="py-6">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <!-- Kalender-Header -->
                <div class="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 sm:rounded-xl mb-6 border border-gray-100 dark:border-gray-700/50">
                    <div class="p-5 sm:p-7">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                            <div class="flex items-center justify-between sm:justify-start space-x-3">
                                <button
                                    @click="navigateMonth(-1)"
                                    class="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                                >
                                    <ChevronLeftIcon class="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                </button>
                                
                                <h3 class="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    {{ monthNames[currentDate.getMonth()] }} {{ currentDate.getFullYear() }}
                                </h3>
                                
                                <button
                                    @click="navigateMonth(1)"
                                    class="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                                >
                                    <ChevronRightIcon class="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                </button>
                            </div>
                            
                            <button
                                @click="goToToday"
                                class="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-200 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                                {{ t('calendar.today') }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Kalender-Grid -->
                <div class="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 sm:rounded-xl overflow-x-auto border border-gray-100 dark:border-gray-700/50">
                    <div class="grid grid-cols-7 border-t border-l border-gray-200/80 dark:border-gray-700/50 min-w-[700px]">
                        <!-- Wochentage-Header -->
                        <div
                            v-for="day in dayNames"
                            :key="day"
                            class="bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800 p-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200/80 dark:border-gray-600/50 uppercase tracking-wider"
                        >
                            {{ day.substring(0, 2) }}
                        </div>

                        <!-- Kalender-Tage -->
                        <div
                            v-for="(date, index) in calendarDays"
                            :key="index"
                            class="min-h-32 sm:min-h-40 border-b border-r border-gray-200/80 dark:border-gray-700/50 transition-colors duration-150"
                            :class="{
                                'bg-gray-50/50 dark:bg-gray-900/50': !date,
                                'bg-gray-50/80 dark:bg-gray-800/80': date && isWeekend(date) && !isToday(date),
                                'bg-white dark:bg-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/70': date && !isWeekend(date) && !isToday(date),
                                'bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50/50 dark:from-indigo-900/30 dark:via-blue-900/20 dark:to-indigo-900/30 border-2 border-indigo-400 dark:border-indigo-500 shadow-inner': date && isToday(date)
                            }"
                            style="position: relative; overflow: hidden;"
                        >
                            <div v-if="date" class="h-full p-2" style="overflow: hidden; position: relative;">
                                <!-- Datum -->
                                <div 
                                    class="text-sm font-bold mb-1 relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
                                    :class="{
                                        'text-gray-500 dark:text-gray-400': isWeekend(date) && !isToday(date),
                                        'text-gray-800 dark:text-gray-200': !isWeekend(date) && !isToday(date),
                                        'bg-gradient-to-br from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 text-white shadow-md ring-2 ring-indigo-200 dark:ring-indigo-800': isToday(date)
                                    }"
                                >
                                    {{ date.getDate() }}
                                </div>

                                <!-- Events Container -->
                                <div class="relative" style="min-height: 80px; height: calc(100% - 20px); overflow: hidden;">
                                    <template v-for="(event, eventIndex) in getEventsForDate(date).slice(0, 6)" :key="`event-${event.invoiceId}-${event.performanceId || 'none'}-${index}`">
                                        <div
                                            class="cursor-pointer hover:opacity-90 hover:shadow-md transition-all duration-200 absolute z-0 overflow-hidden"
                                            :class="[
                                                event.color,
                                                isEventStartDate(event, date) ? 'rounded-l-md rounded-r-none' : '',
                                                isEventEndDate(event, date) ? 'rounded-r-md rounded-l-none' : '',
                                                isEventMiddleDate(event, date) ? 'rounded-none' : 'rounded-md'
                                            ]"
                                            :style="`left: 0; top: ${getEventLane(event, date) * (EVENT_HEIGHT + EVENT_SPACING)}px; height: ${EVENT_HEIGHT}px; width: 100%;`"
                                            @click.stop
                                        >
                                            <Link
                                                :href="route('invoice.show', event.id)"
                                                class="block h-full flex items-center px-1.5 pl-2"
                                                style="height: 100%;"
                                            >
                                                <div class="flex-1 min-w-0">
                                                    <div class="text-[10px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                                                        {{ event.invoice_number }}
                                                    </div>
                                                    <div class="text-[10px] text-gray-700 dark:text-gray-300 truncate leading-tight">
                                                        {{ getEventLocation(event) }} - {{ event.company_name || '' }}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </template>
                                    
                                    <!-- "X more" Indikator -->
                                    <template v-if="getEventsForDate(date).length > 6">
                                        <div
                                            class="text-[10px] px-2 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/70 rounded-md absolute z-10 shadow-sm font-medium"
                                            :style="`top: ${6 * (EVENT_HEIGHT + EVENT_SPACING)}px; left: 0; right: 0;`"
                                        >
                                            +{{ getEventsForDate(date).length - 6 }} {{ t('calendar.more_events') || 'mehr' }}
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Legende -->
                <div class="mt-6 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 sm:rounded-xl p-5 sm:p-7 border border-gray-100 dark:border-gray-700/50">
                    <h4 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-5">{{ t('calendar.legend.title') }}</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
                        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div class="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 rounded-md shadow-sm"></div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('calendar.legend.in_progress') }}</span>
                        </div>
                        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div class="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-md shadow-sm"></div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('calendar.legend.waiting_for_invoice') }}</span>
                        </div>
                        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div class="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-md shadow-sm"></div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('calendar.legend.invoice_sent') }}</span>
                        </div>
                        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div class="w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-md shadow-sm"></div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('calendar.legend.completed') }}</span>
                        </div>
                        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div class="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-md shadow-sm"></div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('calendar.legend.canceled') }}</span>
                        </div>
                    </div>
                    <div class="mt-4 space-y-2">
                        <div class="flex items-center space-x-2">
                            <span class="font-bold">▶</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('calendar.legend.start_date') }}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="font-bold border-2 border-gray-800 dark:border-gray-200 px-1">■</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('calendar.legend.end_date') }}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span>●</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('calendar.legend.performance') }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
