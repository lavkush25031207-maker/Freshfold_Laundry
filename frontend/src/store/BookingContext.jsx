import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const BookingContext = createContext(null);
const emptyDraft = { serviceId: 1, quantity: 3, ironing: false, ironingQuantity: 1, pincode: '', houseNumber: '', streetArea: '', landmark: '', detectedArea: '', latitude: null, longitude: null, pickupSlotId: 1 };

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem('freshfold-draft')) || {}; return { ...emptyDraft, ...saved, address: undefined }; }
    catch { return emptyDraft; }
  });

  useEffect(() => localStorage.setItem('freshfold-draft', JSON.stringify(draft)), [draft]);

  const value = useMemo(() => ({
    draft,
    updateDraft: (changes) => setDraft((current) => ({ ...current, ...changes })),
    clearDraft: () => setDraft(emptyDraft),
  }), [draft]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export const useBooking = () => useContext(BookingContext);
