export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  
  return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
};