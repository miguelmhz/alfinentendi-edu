'use client';

import { ExternalLink, X } from 'lucide-react';

interface LinkConfirmationModalProps {
  isOpen: boolean;
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LinkConfirmationModal = ({ isOpen, url, onConfirm, onCancel }: LinkConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/5 backdrop-blur-sm cursor-pointer"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">
              Abrir enlace externo
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Cerrar"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            ¿Deseas abrir el siguiente enlace en una nueva pestaña?
          </p>
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <p className="text-sm text-gray-800 break-all font-mono">
              {url}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Asegúrate de confiar en este enlace antes de abrirlo.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink size={16} />
            Abrir enlace
          </button>
        </div>
      </div>
    </div>
  );
};
