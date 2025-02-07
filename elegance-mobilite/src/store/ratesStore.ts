let initialized = false;

export async function initRatesStore() {
  if (initialized) return; 
  initialized = true;

  console.debug('Initializing rates store...');
}