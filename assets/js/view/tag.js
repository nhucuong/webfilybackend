$(document).ready(function () {

  const modal = new bootstrap.Modal(document.getElementById("tagModal"));

  // Reset table if exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }


  toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "timeOut": "3000"
  };

  const table = $("#zero_config").DataTable({
    responsive: true,
    autoWidth: false,
    searching: false,
    ajax: { url: "/taggetjson", dataSrc: "data" },
    columns: [
      {
        data: "tag",
        render: (tag) => tag || '<span class="text-muted">No Tag</span>'
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
                  <i class="fa-solid fa-trash me-2 text-danger"></i> Delete
                </button>
              </li>
            </ul>
          </div>`
      }
    ],
    order: [],
  });

  // ========== ADD TAG BUTTON ==========
  $("#addTagBtn").click(() => {
    $("#tagForm")[0].reset();
    $("#tagId").val("");
    $("#tagModalLabel").text("Add Tag");
    modal.show();
  });

  // ========== SUBMIT FORM ==========
  $("#tagForm").submit(function (e) {
    e.preventDefault();

    const formData = $(this).serialize();
    const id = $("#tagId").val();
    const finalData = id ? formData + `&id=${id}` : formData;

    $.ajax({
      url: "/tagsave",
      type: "POST",
      data: finalData,
      success: (res) => {
        if (res.success) {
          toastr.success(res.message); 
          modal.hide();
          $("#tagForm")[0].reset();
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message); 
        }
      },
      error: (xhr) => {
        const res = xhr.responseJSON;
        const msg = res?.message || "Something went wrong!";
        toastr.error(msg); 
      }
    });
  });

  // ========== EDIT TAG ==========
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return toastr.error("Data not found", "Error"); 

    $("#tagForm")[0].reset();
    $("#tagId").val(row._id);
    $("#tagName").val(row.tag || "");

    $("#tagModalLabel").text("Edit Tag");
    modal.show();
  });

  // ========== DELETE TAG ==========
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");

      Swal.fire({
    title: "Are you sure?",
    text: "This Tag will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;
     
      $.ajax({
        url: `/deletetag/${id}`,
        type: "DELETE",
        success: (res) => {
          if (res.success) {
            toastr.success(res.message, "Deleted"); 
            table.ajax.reload(null, false);
          } else toastr.error(res.message); 
        },
        error: () => toastr.error("Failed to delete", "Error") 
      });
  });
  });

});
