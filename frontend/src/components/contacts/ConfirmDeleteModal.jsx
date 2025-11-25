"use client";

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, contactName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
        <h2 className="text-lg font-semibold mb-4">Supprimer le contact</h2>
        <p className="mb-6">Voulez-vous supprimer {contactName} ?</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Non
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Oui
          </button>
        </div>
      </div>
    </div>
  );
}
