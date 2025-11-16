import Swal from 'sweetalert2';

// Configuración base para todas las alertas
const baseConfig = {
  confirmButtonColor: '#7c3aed',
  cancelButtonColor: '#6b7280',
  confirmButtonText: 'Confirmar',
  cancelButtonText: 'Cancelar',
  customClass: {
    popup: 'rounded-2xl',
    confirmButton: 'rounded-lg px-6 py-2.5 font-medium',
    cancelButton: 'rounded-lg px-6 py-2.5 font-medium',
  },
};

// Alerta de éxito
export const successAlert = (message, title = '¡Éxito!') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'Entendido',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Alerta de error
export const errorAlert = (message, title = 'Error') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Entendido',
  });
};

// Alerta de advertencia
export const warningAlert = (message, title = 'Atención') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'Entendido',
  });
};

// Alerta de información
export const infoAlert = (message, title = 'Información') => {
  return Swal.fire({
    ...baseConfig,
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'Entendido',
  });
};

// Confirmación
export const confirmAlert = async (
  message,
  title = '¿Estás seguro?',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar'
) => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
};

// Confirmación de eliminación
export const confirmDelete = async (itemName = 'este elemento') => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title: '¿Eliminar?',
    html: `¿Estás seguro de que deseas eliminar <strong>${itemName}</strong>?<br><small class="text-gray-500">Esta acción no se puede deshacer</small>`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });

  return result.isConfirmed;
};

// Alerta con input
export const inputAlert = async (title, inputLabel, inputType = 'text') => {
  const result = await Swal.fire({
    ...baseConfig,
    title,
    input: inputType,
    inputLabel,
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Este campo es requerido';
      }
    },
  });

  return result.isConfirmed ? result.value : null;
};

// Toast notification (esquina superior derecha)
export const toast = {
  success: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  },
  error: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  },
  info: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  },
  warning: (message) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-lg',
      },
    });
  },
};

// Loading alert
export const loadingAlert = (message = 'Cargando...') => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Cerrar loading
export const closeLoading = () => {
  Swal.close();
};

export default {
  success: successAlert,
  error: errorAlert,
  warning: warningAlert,
  info: infoAlert,
  confirm: confirmAlert,
  confirmDelete,
  input: inputAlert,
  toast,
  loading: loadingAlert,
  closeLoading,
};
