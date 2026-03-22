import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import PaymentTypeModal from "../components/modals/PaymentTypeModal.jsx";
import DeleteModal from "../components/modals/DeleteModal.jsx";
import usePaymentTypeStore from "../stores/paymentTypeStore.js";

const STATUS_STYLES = {
  active: "bg-[#00af00]/10 text-[#00af00]",
  inactive: "bg-gray-100 text-gray-700",
};

const RECEIPT_STYLES = {
  required: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  not_required: "bg-gray-100 text-gray-700",
};

export default function PaymentTypes() {
  const {
    paymentTypes,
    fetchPaymentTypes,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    deleteMultiplePaymentTypes,
    loading,
    error,
  } = usePaymentTypeStore();

  const [modal, setModal] = useState({
    open: false,
    mode: "add", // add | edit
    paymentType: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    paymentType: null,
    isBulk: false,
  });

  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    fetchPaymentTypes().catch((err) =>
      toast.error(err.message || "Failed to fetch payment types"),
    );
  }, [fetchPaymentTypes]);

  // Toggle selection of an item
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Select all items
  const selectAll = () => {
    if (selectedItems.size === paymentTypes.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paymentTypes.map((pt) => pt._id)));
    }
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Open bulk delete modal
  const openBulkDelete = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one payment type to delete");
      return;
    }
    setDeleteModal({
      open: true,
      isBulk: true,
      paymentType: null,
    });
  };

  const title = useMemo(
    () => (modal.mode === "add" ? "Add Payment Type" : "Edit Payment Type"),
    [modal.mode],
  );

  function openAdd() {
    setModal({ open: true, mode: "add", paymentType: null });
  }

  function openEdit(paymentType) {
    setModal({ open: true, mode: "edit", paymentType });
  }

  function closeModal() {
    setModal({ open: false, mode: "add", paymentType: null });
  }

  async function savePaymentType(payload) {
    try {
      if (modal.mode === "add") {
        await createPaymentType({
          name: payload.name,
          isReceipt: payload.isReceipt,
          isActive: true,
        });
        toast.success("Payment type created successfully!");
      } else {
        await updatePaymentType(payload._id, {
          name: payload.name,
          isReceipt: payload.isReceipt,
          isActive: payload.isActive,
        });
        toast.success("Payment type updated successfully!");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  }

  async function confirmDelete() {
    try {
      if (deleteModal.isBulk) {
        // Bulk delete
        const ids = Array.from(selectedItems);
        await deleteMultiplePaymentTypes(ids);
        toast.success(`${ids.length} payment type(s) deleted successfully!`);
        clearSelection();
      } else {
        // Single delete
        await deletePaymentType(deleteModal.paymentType._id);
        toast.success("Payment type deleted successfully!");
      }
      setDeleteModal({ open: false, paymentType: null, isBulk: false });
    } catch (err) {
      toast.error(err.message || "Failed to delete payment type(s)");
    }
  }

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
          },
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">Payment Types</div>
          <div className="text-sm text-gray-600">
            Manage payment type names, receipt requirements, and availability
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedItems.size > 0 && (
            <>
              <button
                type="button"
                onClick={openBulkDelete}
                className="
                  h-11 px-5 rounded-xl 
                  bg-[#0c2bfc] 
                  hover:bg-[#0a24d6]
                  text-white text-sm font-medium inline-flex items-center gap-2
                  transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5
                  active:translate-y-0
                "
              >
                <FiTrash2 className="w-4 h-4" />
                Delete ({selectedItems.size})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="
                  h-11 px-5 rounded-xl 
                  border border-gray-200 
                  bg-white
                  hover:bg-gray-50
                  text-sm font-medium inline-flex items-center gap-2
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0
                  text-gray-700 hover:text-[#0c2bfc]
                "
              >
                <FiX className="w-4 h-4" />
                Clear
              </button>
            </>
          )}
          <button
            type="button"
            onClick={openAdd}
            className="
              h-11 px-5 rounded-xl 
              bg-[#0c2bfc] 
              hover:bg-[#0a24d6]
              text-white text-sm font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-lg hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            <FiPlus className="w-4 h-4" />
            Add Payment Type
          </button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedItems.size > 0 && (
        <div className="text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedItems.size}</span>
            payment type{selectedItems.size > 1 ? "s" : ""} selected
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0c2bfc] border-t-transparent rounded-full animate-spin"></div>
          Loading payment types...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {paymentTypes.map((type) => {
          const isSelected = selectedItems.has(type._id);
          return (
            <div
              key={type._id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (
                  e.target.closest("button[data-select]") ||
                  e.target.closest("button[data-delete]")
                )
                  return;
                openEdit(type);
              }}
              onKeyDown={(e) => e.key === "Enter" && openEdit(type)}
              className={`
                group relative cursor-pointer overflow-hidden
                rounded-xl border-2
                bg-white
                p-5 text-left shadow-sm
                transition-all duration-300
                hover:shadow-lg hover:-translate-y-1
                focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20
                ${
                  isSelected
                    ? "border-[#0c2bfc] bg-[#0c2bfc]/5"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
              title="Click to edit"
            >
              {/* Selection checkbox */}
              <button
                type="button"
                data-select
                onClick={() => toggleSelection(type._id)}
                className={`
                  absolute left-4 top-4 z-10
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-all duration-200
                  ${
                    isSelected
                      ? "bg-[#0c2bfc] border-[#0c2bfc] text-white"
                      : "bg-white border-gray-300 hover:border-[#0c2bfc] hover:shadow-sm"
                  }
                `}
                title={isSelected ? "Deselect" : "Select"}
              >
                {isSelected && <FiCheck size={12} />}
              </button>

              {/* Accent bar */}
              <div
                className={`
                  absolute inset-x-0 top-0 h-1.5
                  ${type.isActive ? "bg-[#0c2bfc]" : "bg-gray-300"}
                `}
              />

              {/* Delete button */}
              <button
                type="button"
                data-delete
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModal({
                    open: true,
                    paymentType: type,
                    isBulk: false,
                  });
                }}
                className="
                  absolute right-4 top-4 z-10
                  w-9 h-9 rounded-xl
                  bg-white
                  border border-gray-200
                  text-[#0c2bfc]
                  opacity-0 group-hover:opacity-100
                  hover:bg-gray-50
                  hover:border-gray-300 hover:shadow-md
                  focus:opacity-100
                  focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20
                  transition-all duration-200
                  grid place-items-center
                "
                title="Delete payment type"
              >
                <FiTrash2 size={16} />
              </button>

              {/* Content */}
              <div className="ml-7">
                <h2 className="text-base font-semibold text-gray-900 group-hover:text-[#0c2bfc] transition-colors duration-200">
                  {type.name}
                </h2>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        ${
                          type.isActive
                            ? "bg-[#00af00]/10 text-[#00af00]"
                            : "bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      {type.isActive ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        ${
                          type.isReceipt
                            ? "bg-[#0c2bfc]/10 text-[#0c2bfc]"
                            : "bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      {type.isReceipt ? "Receipt Required" : "No Receipt"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-gray-500">
                {isSelected
                  ? "Selected - Click card to edit"
                  : "Click card to edit"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && paymentTypes.length === 0 && (
        <div
          className="
            rounded-xl border border-gray-200 
            bg-white
            px-6 py-16 text-center
          "
        >
          <div className="text-gray-300 mb-3">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-gray-700 font-medium text-lg">
            No payment types found
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Add your first payment type to get started
          </div>
        </div>
      )}

      {/* Select All / Deselect All */}
      {paymentTypes.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={selectAll}
            className="
              text-sm font-medium inline-flex items-center gap-2
              text-[#0c2bfc] hover:text-[#0a24d6]
              transition-colors duration-200
            "
          >
            {selectedItems.size === paymentTypes.length
              ? "Deselect All"
              : "Select All"}
          </button>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {paymentTypes.length}
            </span>{" "}
            payment type{paymentTypes.length > 1 ? "s" : ""} total
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modal.open && (
        <PaymentTypeModal
          open={modal.open}
          mode={modal.mode}
          title={title}
          paymentType={modal.paymentType}
          onClose={closeModal}
          onSave={savePaymentType}
        />
      )}

      {/* Dynamic Delete Confirmation Modal */}
      {deleteModal.open && (
        <DeleteModal
          entity={deleteModal.paymentType}
          entityName="payment type"
          title="Delete Payment Type"
          onClose={() => setDeleteModal({ open: false, paymentType: null })}
          onConfirm={confirmDelete}
          requireNameConfirmation={true}
        />
      )}
    </div>
  );
}
