import cron from 'node-cron';
import { runScraping } from '../services/scraper.js';

// Ejecutar scraping todos los días a las 3:00 AM
export function initCronJobs() {
  console.log('✓ Inicializando tareas programadas...');

  // Cron schedule: "0 3 * * *" = cada día a las 3:00 AM
  // Para testing, usar "*/5 * * * *" = cada 5 minutos
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Iniciando scraping automático programado...');
    try {
      await runScraping();
      console.log('✓ Scraping automático completado');
    } catch (error) {
      console.error('✗ Error en scraping automático:', error);
    }
  });

  console.log('✓ Scraping programado para las 3:00 AM todos los días');
}
