'use client';

import { useState, useCallback } from 'react';
import { GraffitiSighting, GraffitiCategory } from '@/types';
import { useSightings } from '@/hooks/useSightings';
import { CategoriesProvider } from '@/contexts/CategoriesContext';
import MapWrapper from '@/components/map/MapWrapper';
import SubmitModal from '@/components/submit/SubmitModal';
import EditModal from '@/components/edit/EditModal';
import Sidebar from '@/components/sidebar/Sidebar';
import ManageCategoriesModal from '@/components/manage/ManageCategoriesModal';
import AdminPanel from '@/components/admin/AdminPanel';
import ImageLightbox from '@/components/map/ImageLightbox';

interface Props {
  initial: GraffitiSighting[];
}

function HomeInner({ initial }: Props) {
  const { sightings, updateSighting, deleteSighting } = useSightings(initial);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [editingSighting, setEditingSighting] = useState<GraffitiSighting | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<GraffitiCategory | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingPin({ lat, lng });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const visibleSightings = activeFilter
    ? sightings.filter((s) => s.category === activeFilter)
    : sightings;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapWrapper
        sightings={visibleSightings}
        onMapClick={handleMapClick}
        onImageClick={setLightboxUrl}
      />

      <Sidebar
        sightings={sightings}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onEdit={setEditingSighting}
        onManageCategories={() => setManagingCategories(true)}
        onAdminPanel={() => setAdminOpen(true)}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-500 shadow-sm pointer-events-none">
        Click map to pin a sighting
      </div>

      {pendingPin && (
        <SubmitModal
          lat={pendingPin.lat}
          lng={pendingPin.lng}
          onSuccess={() => { setPendingPin(null); showToast('📍 Submitted! Waiting for approval.'); }}
          onClose={() => setPendingPin(null)}
        />
      )}

      {editingSighting && (
        <EditModal
          sighting={editingSighting}
          onSuccess={(updated) => { updateSighting(updated); setEditingSighting(null); showToast('✏️ Sighting updated.'); }}
          onDelete={(id) => { deleteSighting(id); setEditingSighting(null); showToast('🗑️ Sighting deleted.'); }}
          onClose={() => setEditingSighting(null)}
        />
      )}

      {managingCategories && (
        <ManageCategoriesModal sightings={sightings} onClose={() => setManagingCategories(false)} />
      )}

      {adminOpen && (
        <AdminPanel onClose={() => setAdminOpen(false)} />
      )}

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function HomeClient({ initial }: Props) {
  return (
    <CategoriesProvider>
      <HomeInner initial={initial} />
    </CategoriesProvider>
  );
}
