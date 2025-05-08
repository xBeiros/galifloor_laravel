import { defineStore } from 'pinia';
import axios from 'axios';

export const usePerformanceStore = defineStore('performanceStore', {
    state: () => ({
        performances: [] as Array<any>, // Performances als Array
    }),
    actions: {
        async fetchPerformances(invoiceId: number) {
            try {
                const response = await axios.get(`/performances/${invoiceId}`);
                this.performances = response.data;
            } catch (error) {
                console.error("Fehler beim Laden der Performances:", error);
            }
        },

        async addPerformance(values: any, invoiceId: number, dateTime: string) {
            try {
                const response = await axios.post(`/api/invoices/${invoiceId}/performances`, {
                    ...values,
                    date: dateTime,
                });

                if (response.data) {
                    this.performances.push(response.data); // Neu erstellte Performance zur Liste hinzufügen
                }

                return response.data;
            } catch (error) {
                console.error("Fehler beim Erstellen der Performance:", error);
                throw error; // Fehler weiterwerfen, damit das UI es erkennt
            }
        },

        async changePerformanceDate(id: number, newDate: string, status: string) {
            try {
                const response = await axios.patch(`/api/performances/${id}/date`, {
                    date_changed_to: newDate,
                    status: status, // Setzt den Status auf 'date_change'
                });

                // Aktualisiere die Performance in der Store-Liste
                const index = this.performances.findIndex(p => p.id === id);
                if (index !== -1) {
                    this.performances[index].date_changed_to = newDate;
                    this.performances[index].status = status;
                }

                return response.data;
            } catch (error) {
                console.error("Fehler beim Ändern des Datums:", error);
                throw error;
            }
        },

        async changePerformanceStatus(id: number, newStatus: string) {
            try {
                const response = await axios.patch(`/api/performances/${id}/status`, {
                    status: newStatus,
                });

                // Performance in Store aktualisieren
                const index = this.performances.findIndex(p => p.id === id);
                if (index !== -1) {
                    this.performances[index].status = newStatus;
                }

                return response.data;
            } catch (error) {
                console.error("Fehler beim Ändern des Status:", error);
                throw error;
            }
        },


        async deletePerformance(id: number) {
            try {
                await axios.delete(`/api/performances/${id}`); // <== Stelle sicher, dass "/api/" hier ist
                this.performances = this.performances.filter(p => p.id !== id);
            } catch (error) {
                console.error("Fehler beim Löschen der Performance:", error);
            }
        }

    }
});
