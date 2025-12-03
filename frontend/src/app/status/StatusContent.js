// frontend/src/app/status/StatusContent.js
'use client';

import StatusList from '../../components/Status/StatusList';

export default function StatusContent() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <StatusList />
      </div>
    </div>
  );
}