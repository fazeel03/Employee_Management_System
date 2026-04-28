import { useModal, MODAL_TYPES } from '../context/ModalContext';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';
import SuccessModal from './modals/SuccessModal';
import ErrorModal from './modals/ErrorModal';
import WarningModal from './modals/WarningModal';
import ConfirmActionModal from './modals/ConfirmActionModal';

const ModalManager = () => {
  const { modal, closeModal } = useModal();

  if (!modal) return null;

  const renderModal = () => {
    switch (modal.type) {
      case MODAL_TYPES.CONFIRM_DELETE:
        return (
          <ConfirmDeleteModal
            isOpen={true}
            onClose={closeModal}
            itemName={modal.itemName}
            onConfirm={modal.onConfirm}
            itemDetails={modal.itemDetails}
          />
        );

      case MODAL_TYPES.SUCCESS:
        return (
          <SuccessModal
            isOpen={true}
            onClose={modal.onOk || closeModal}
            message={modal.message}
          />
        );

      case MODAL_TYPES.ERROR:
        return (
          <ErrorModal
            isOpen={true}
            onClose={modal.onOk || closeModal}
            message={modal.message}
          />
        );

      case MODAL_TYPES.WARNING:
        return (
          <WarningModal
            isOpen={true}
            onClose={modal.onCancel || closeModal}
            message={modal.message}
            onProceed={modal.onProceed}
            onCancel={modal.onCancel}
          />
        );

      case MODAL_TYPES.CONFIRM_ACTION:
        return (
          <ConfirmActionModal
            isOpen={true}
            onClose={modal.onCancel || closeModal}
            title={modal.title}
            message={modal.message}
            onConfirm={modal.onConfirm}
            onCancel={modal.onCancel}
            confirmText={modal.confirmText}
            cancelText={modal.cancelText}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderModal()}</>;
};

export default ModalManager;
