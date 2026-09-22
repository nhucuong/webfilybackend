$(document).ready(function () {
  const modal = new bootstrap.Modal(document.getElementById("categoryModal"));

  // ================= TOASTR CONFIG =================
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000",
  };

  // ================= DATATABLE =================
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    responsive: true,
    autoWidth: false,
    ajax: { url: "/getcategoryjson", dataSrc: "data" },
    columns: [
      { 
        data: "type",
        render : (d)=>
          d?d.length > 30 ? d.substring(0,30) + "..." : d
          : `<span class="text-muted">N/A</span>` 
      },

      {
        data: "iconName",
        render: (d) => d || `<span class="text-muted">N/A</span>`,
      },

      {
        data: "shortDescription",
        render: (d) =>
          d
            ? d.length > 40
              ? d.substring(0, 40) + "..."
              : d
            : `<span class="text-muted">N/A</span>`,
      },

      {
        data: "status",
        render: (data) =>
          data
            ? `<span class="badge bg-success">Enabled</span>`
            : `<span class="badge bg-danger">Disabled</span>`,
        className: "text-center",
      },

      {
        data: null,
        className: "text-center",
        render: (row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
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
                <button class="dropdown-item status-btn" data-id="${row._id}">
                  <i class="fa-regular ${
                    row.status ? "fa-eye-slash" : "fa-eye"
                  } me-2 text-warning"></i>
                  ${row.status ? "Disable" : "Enable"}
                </button>
              </li>
            </ul>
          </div>
        `,
      },
    ],
    order: [],
  });

  // ================= ADD =================
  $("#addCategoryBtn").click(() => {
    $("#categoryForm")[0].reset();
    $("#categoryId").val("");
    $("#categoryStatus").prop("checked", true);
    $("#categoryModalLabel").text("Add BusinessType");
    modal.show();
  });

  // ================= SUBMIT (SPINNER + TOASTR) =================
  $("#categoryForm").submit(function (e) {
    e.preventDefault();

    const $submitBtn = $("#categoryForm button[type='submit']"); 
    const originalBtnContent = $submitBtn.html();

    // spinner + disable
    $submitBtn.prop("disabled", true);
    $submitBtn.html(`
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    `);

    const data = {
      id: $("#categoryId").val(),
      type: $("#type").val(),
      iconName: $("#iconName").val(),
      shortDescription: $("#shortDescription").val(),
      status: $("#categoryStatus").is(":checked") ? "true" : "false",
    };

    $.ajax({
      url: "/savecategory",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: (res) => {
        $submitBtn.prop("disabled", false).html(originalBtnContent);

        if (res.success) {
          toastr.success(res.message || "Saved successfully");
          modal.hide();
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Save failed");
        }
      },
      error: () => {
        $submitBtn.prop("disabled", false).html(originalBtnContent);
        toastr.error("Something went wrong!");
      },
    });
  });

  // ================= EDIT =================
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) {
      toastr.error("Data not found");
      return;
    }

    $("#categoryId").val(row._id);
    $("#type").val(row.type);
    $("#iconName").val(row.iconName);
    $("#shortDescription").val(row.shortDescription);
    $("#categoryStatus").prop("checked", row.status);

    $("#categoryModalLabel").text("Edit BusinessType");
    modal.show();
  });

  // ================= DELETE (NO SWEETALERT) =================
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");
  Swal.fire({
    title: "Are you sure?",
    text: "This BusinessType will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;

    $.ajax({
      url: `/categorydelete/${id}`,
      type: "DELETE",
      success: (res) => {
        if (res.success) {
          toastr.success(res.message || "Deleted successfully");
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message || "Delete failed");
        }
      },
      error: () => toastr.error("Failed to delete category"),
    });
      });
  });

  // ================= STATUS TOGGLE =================
  $("#zero_config").on("click", ".status-btn", function () {
    const id = $(this).data("id");

    $.post(`/categorystatus/${id}`, {}, (res) => {
      if (res.success) {
        toastr.success(res.message || "Status updated");
        table.ajax.reload(null, false);
      } else {
        toastr.error(res.message || "Status update failed");
      }
    });
  });
});
