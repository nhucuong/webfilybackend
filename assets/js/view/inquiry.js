$(document).ready(function () {

  // Destroy if already exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: "/inquiryjson",
    columns: [
      {
        data: null,
        render: function (data, type, row) {
          return `${row.firstName} ${row.lastName}`;
        }
      },
      { data: "email" },
      { data: "subject" },
      {
        data: "message",
        render: function (data, type, row) {
          if (!data) return "";

          const limit = 40;

          return data.length > limit
            ? data.substring(0, limit) + "..."
            : data;
        }
      },
      {
        data: null,
        className: "text-center",
        render: (data, type, row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
              
              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash text-danger me-2"></i>Delete
                </button>
              </li>
                   <li>
            <a href="javascript:void(0);" 
          class="dropdown-item viewInquiryBtn"
                  data-name="${row.firstName || ''} ${row.lastName || ''}" 
          data-email="${row.email || ''}"
   data-message="${encodeURIComponent(row.message || '')}">
       <i class="fa-solid fa-eye text-info me-2"></i>View
      </a>
      </li>
            </ul>
          </div>
        `
      }
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
  });



  setTimeout(() => {
    const searchContainer = $("#zero_config_filter");
    if (searchContainer.length && !$("#refreshTableBtn").length) {
      searchContainer.addClass("d-flex justify-content-end gap-2").append(`
        <button id="refreshTableBtn" class="btn btn-sm btn-outline-secondary ms-2" title="Refresh Table">
          <i class="fa fa-rotate"></i>
        </button>
      `);
    }
  }, 300);

  // Refresh table on button click
  $(document).on("click", "#refreshTableBtn", function () {
    table.ajax.reload(null, false); // reload without resetting pagination
  });


  // DELETE ACTION
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");


      Swal.fire({
    title: "Are you sure?",
    text: "This Inquiry will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;

    $.ajax({
      url: `/inquirydelete/${id}`,
      type: "DELETE",
      success: (res) => {
        if (res.success) {
          toastr.success(res.message || "Deleted successfully");
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Delete failed");
        }
      },
      error: () => {
        toastr.error("Failed to delete");
      }
    });
  });
    });

  $(document).on("click", ".viewInquiryBtn", function () {
    const name = $(this).data("name") || "-";
    const email = $(this).data("email") || "-";
    const message = decodeURIComponent($(this).data("message") || "-");

    $("#inquiryName").text(name);
    $("#inquiryEmail").text(email);
    $("#inquiryMessage").text(message);

    const modalEl = document.getElementById("inquiryDetailsModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  });

});

