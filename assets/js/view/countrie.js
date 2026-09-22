$(document).ready(function () {
  const modal = new bootstrap.Modal(document.getElementById("countriesModal"));

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  // --- DataTable with server-side pagination ---
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: {
      url: "/getcountriesjson",
      type: "GET"
    },
    columns: [
      { data: "name" },
      {
        data: "status",
        className: "text-center",
        render: (data) =>
          data
            ? `<span class="badge bg-success">Enabled</span>`
            : `<span class="badge bg-danger">Disabled</span>`
      },
      {
        data: null,
        className: "text-center",
        render: (row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <button class="dropdown-item edit-btn" data-id="${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>
              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash me-2 text-danger"></i>Delete
                </button>
              </li>
              <li>
               <button class="dropdown-item status-btn d-flex align-items-center"
        data-id="${row._id}">
  <i class="fa-regular ${row.status ? "fa-eye-slash" : "fa-eye"} me-2 text-warning"></i>
  <span>${row.status ? "Disable" : "Enable"}</span>
</button>

              </li>
            </ul>
          </div>
        `
      },
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
  });

  // --- Add Country ---
  $("#addCountryBtn").click(() => {
    $("#countriesForm")[0].reset();
    $("#countryId").val("");
    $("#countryStatus").prop("checked", true);
    $("#countriesModalLabel").text("Add Country");
    modal.show();
  });

  // --- Submit Form ---
  $("#countriesForm").submit(function (e) {
    e.preventDefault();
    const data = {
      id: $("#countryId").val(),
      name: $("#countryTitle").val(),
      status: $("#countryStatus").is(":checked") ? "true" : "false"
    };

    $.ajax({
      url: "/savecountry",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: (res) => {
        if (res.success) {
          toastr.success(res.message || "Saved successfully");
          modal.hide();
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Save failed");
        }
      },
      error: () => toastr.error("Something went wrong!")
    });
  });

  // --- Edit Country ---
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return toastr.error("Data not found!");

    $("#countryId").val(row._id);
    $("#countryTitle").val(row.name);
    $("#countryStatus").prop("checked", row.status);
    $("#countriesModalLabel").text("Edit Country");
    modal.show();
  });

  // --- Delete Country ---
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");
   
      Swal.fire({
    title: "Are you sure?",
    text: "This Country will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;

    $.ajax({
      url: `/countrydelete/${id}`,
      type: "DELETE",
      success: (res) => {
        if (res.success) {
          toastr.success(res.message || "Deleted successfully");
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Delete failed");
        }
      },
      error: () => toastr.error("Failed to delete Country")
    });
   });
  });


  // --- Toggle Enable/Disable Status ---
  $("#zero_config").on("click", ".status-btn", function () {
    const id = $(this).data("id");
    $.post(`/countrystatus/${id}`, {}, (res) => {
      if (res.success) {
        toastr.success(res.message || "Status updated");
        table.ajax.reload(null, false);
      } else {
        toastr.error(res.message || "Status update failed");
      }
    });
  });
});
