import { createContext, useContext, useState, useCallback } from 'react';

// Modal types
export const MODAL_TYPES = {
  CONFIRM_DELETE: 'CONFIRM_DELETE',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  CONFIRM_ACTION: 'CONFIRM_ACTION'
};

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const showModal = useCallback((modalConfig) => {
    setModal(modalConfig);
  }, []);

  // Specific modal methods
  const showConfirmDelete = useCallback((itemName, onConfirm, itemDetails = '') => {
    showModal({
      type: MODAL_TYPES.CONFIRM_DELETE,
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}?${itemDetails ? `\n\n${itemDetails}` : ''}`,
      itemName,
      onConfirm,
      onCancel: closeModal
    });
  }, [showModal, closeModal]);

  const showSuccess = useCallback((message, onOk = closeModal) => {
    showModal({
      type: MODAL_TYPES.SUCCESS,
      title: 'Success',
      message,
      onOk
    });
  }, [showModal, closeModal]);

  const showError = useCallback((message, onOk = closeModal) => {
    showModal({
      type: MODAL_TYPES.ERROR,
      title: 'Error',
      message,
      onOk
    });
  }, [showModal, closeModal]);

  const showWarning = useCallback((message, onProceed = null, onCancel = closeModal) => {
    showModal({
      type: MODAL_TYPES.WARNING,
      title: 'Warning',
      message,
      onProceed,
      onCancel
    });
  }, [showModal, closeModal]);

  const showConfirmAction = useCallback((title, message, onConfirm, onCancel = closeModal, confirmText = 'Confirm', cancelText = 'Cancel') => {
    showModal({
      type: MODAL_TYPES.CONFIRM_ACTION,
      title,
      message,
      onConfirm,
      onCancel,
      confirmText,
      cancelText
    });
  }, [showModal, closeModal]);

  const value = {
    modal,
    closeModal,
    showModal,
    showConfirmDelete,
    showSuccess,
    showError,
    showWarning,
    showConfirmAction
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
