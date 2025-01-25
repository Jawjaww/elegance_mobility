import { create } from 'zustand';
import { GooglePlace, AddressField } from './types';
import { reverseGeocode } from '../services/MapService';

interface Coordinates {
  lat: number;
  lng: number;
}

interface AddressState {
  pickup: {
    raw: string;
    validated?: GooglePlace;
    coords?: Coordinates;
  };
  dropoff: {
    raw: string;
    validated?: GooglePlace;
    coords?: Coordinates;
  };
  suggestions: GooglePlace[];
  loading: boolean;
  error: string | null;
  currentFocus?: AddressField;
  previewAddress?: string;
}

interface AddressActions {
  setRawAddress: (type: AddressField, value: string) => void;
  selectSuggestion: (type: AddressField, place: GooglePlace) => void;
  clearSuggestions: () => void;
  setFocus: (type?: AddressField) => void;
  setSuggestions: (suggestions: GooglePlace[]) => void;
  validateAddress: (type: AddressField) => Promise<void>;
  geolocateUser: () => Promise<void>;
  setPreviewAddress: (address: string | null, type: AddressField) => void;
  confirmAddress: (type: AddressField) => void;
  clear: () => void;
}

export const useAddressStore = create<AddressState & AddressActions>((set, get) => ({
  setSuggestions: (suggestions) => set({ suggestions }),
  pickup: { raw: '' },
  dropoff: { raw: '' },
  suggestions: [],
  loading: false,
  error: null,
  currentFocus: undefined,
  previewAddress: undefined,

  setRawAddress: (type, value) => {
    set((state) => ({
      ...state,
      [type]: { ...state[type], raw: value },
      suggestions: [],
      error: null
    }));
  },

  selectSuggestion: (type, place) => {
    set((state) => ({
      ...state,
      [type]: {
        raw: place.description,
        validated: place
      },
      suggestions: []
    }));
  },

  clearSuggestions: () => set({ suggestions: [] }),

  setFocus: (type) => set({ currentFocus: type }),

  validateAddress: async (type) => {
    const { raw } = get()[type];
    if (!raw) return;

    set({ loading: true, error: null });
    
    try {
      // Convertir l'adresse en coordonnées
      const geocoder = new google.maps.Geocoder();
      const results = await new Promise<google.maps.GeocoderResult[] | null>((resolve, reject) => {
        geocoder.geocode({ address: raw }, (results, status) => {
          if (status === 'OK') {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
      
      if (!results || !results[0]) {
        throw new Error('Adresse non trouvée');
      }
      
      const coords = results[0].geometry.location.toJSON();
      const validated = await reverseGeocode(coords.lat, coords.lng);
      set((state) => ({
        ...state,
        [type]: { ...state[type], validated },
        loading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur de validation',
        loading: false
      });
    }
  },

  geolocateUser: async () => {
    set({ loading: true, error: null });
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      const address = await reverseGeocode(coords.lat, coords.lng);
      const type = get().currentFocus || 'pickup';
      
      set((state) => ({
        ...state,
        [type]: {
          raw: address,
          validated: null,
          coords
        },
        loading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erreur de géolocalisation',
        loading: false
      });
    }
  },

  setPreviewAddress: (address, type) => {
    set((state) => ({
      ...state,
      previewAddress: address || undefined,
      [type]: {
        ...state[type],
        raw: address || ''
      }
    }));
  },

  confirmAddress: (type) => {
    set((state) => ({
      ...state,
      previewAddress: undefined,
      [type]: {
        ...state[type],
        raw: state.previewAddress || state[type].raw
      }
    }));
  },

  clear: () => set({
    pickup: { raw: '' },
    dropoff: { raw: '' },
    suggestions: [],
    error: null,
    previewAddress: undefined
  })
}));