import { useEffect } from 'react';
import Modal from '../Modal';

const SuccessModal = ({ isOpen, onClose, message, autoClose = true }) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Success" size="sm">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Success!
          </h4>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* OK Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200 font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SuccessModal;
