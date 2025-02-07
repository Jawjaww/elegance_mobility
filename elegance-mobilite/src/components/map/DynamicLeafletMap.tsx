import dynamic from 'next/dynamic';
export type { MapMarker } from './LeafletMap';

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-neutral-800 rounded-lg flex items-center justify-center">
      <div className="text-neutral-400">Chargement de la carte...</div>
    </div>
  )
});

export default DynamicLeafletMap;