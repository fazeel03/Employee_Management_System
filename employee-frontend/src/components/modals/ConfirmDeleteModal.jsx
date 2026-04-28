import Modal from '../Modal';

const ConfirmDeleteModal = ({ isOpen, onClose, itemName, onConfirm, itemDetails = '' }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Delete Confirmation" size="sm">
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Delete {itemName}?
          </h4>
          <p className="text-gray-600">
            Are you sure you want to delete this {itemName}? This action cannot be undone.
          </p>
          {itemDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
              <strong>Item details:</strong>
              <div className="mt-1">{itemDetails}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
