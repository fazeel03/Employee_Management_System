import Modal from '../Modal';

const ErrorModal = ({ isOpen, onClose, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Error" size="sm">
      <div className="text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Error!
          </h4>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* OK Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;
