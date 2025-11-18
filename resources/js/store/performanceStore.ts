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
                // Formatiere end_date falls vorhanden
                const payload: any = {
                    ...values,
                    date: dateTime,
                };
                
                // Wenn end_date vorhanden ist, formatiere es korrekt
                if (values.end_date) {
                    payload.end_date = values.end_date;
                }
                
                const response = await axios.post(`/api/invoices/${invoiceId}/performances`, payload);

                if (response.data) {
                    // Wenn mehrere Performances erstellt wurden (Array), alle hinzufügen
                    // Normalerweise sollte nur eine Performance zurückgegeben werden
                    if (Array.isArray(response.data)) {
                        this.performances.push(...response.data);
                    } else {
                        this.performances.push(response.data);
                    }
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

                // Performance in Store aktualisieren mit dem tatsächlichen Status vom Backend
                // (kann sich von newStatus unterscheiden, z.B. wenn 'no_change' zu 'modified' wird)
                const index = this.performances.findIndex(p => p.id === id);
                if (index !== -1 && response.data) {
                    this.performances[index].status = response.data.status || newStatus;
                    // Aktualisiere auch modified_after_issue, falls vorhanden
                    if (response.data.modified_after_issue !== undefined) {
                        this.performances[index].modified_after_issue = response.data.modified_after_issue;
                    }
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
