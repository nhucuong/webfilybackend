$(document).ready(function () {
  const modal = new bootstrap.Modal(
    document.getElementById("translationManagerModal"),
  );

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000",
  };
  // --- Load Languages into dropdown ---
  function loadlanguages(selectedId) {
    $.get("/getlanguageselect", (res) => {
      if (res.success) {
        let options = "<option selected disabled>Select Language</option>";
        res.data.forEach((c) => {
          options += `<option value="${c.code}" ${selectedId == c.code ? "selected" : ""}>${c.name}</option>`;
        });
        $("#languageSelect").html(options);
      }
    });
  }
  // --- Destroy table if already initialized ---
  if ($.fn.DataTable.isDataTable("#translations_config")) {
    $("#translations_config").DataTable().clear().destroy();
  }

  // --- DataTable ---
  const table = $("#translations_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: "/gettranslationmanagerjson",
    columns: [
      { data: "languageName" },
      {
        data: "status",
        render: (data) =>
          data
            ? '<span class="badge bg-success">Enabled</span>'
            : '<span class="badge bg-danger">Disabled</span>',
        className: "text-center",
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
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit String
                </button>
              </li>
              ${
        row?.code === "en"
          ? ""
          :`
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
              `}
          </div>`,
      },
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
  });

  // --- Add State ---
  $("#addTranslationBtn").click(() => {
    $("#translationForm")[0].reset();
    $("#translationId").val("");
    $("#translationStatus").prop("checked", true);
    $("#translationManagerModalLabel").text("Add Translation Manager");
    loadlanguages();
    modal.show();
  });

  // --- Submit Form ---
  $("#translationForm").submit(function (e) {
    e.preventDefault();
    const data = {
      id: $("#translationId").val(),
      code: $("#languageSelect").val(),
      status: $("#translationStatus").is(":checked") ? "true" : "false",
    };
    $.ajax({
      url: "/savetranslationmanages",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: (res) => {
        if (res.success) {
          toastr.success(res.message || "Saved successfully");
          modal.hide();
          table.ajax.reload(null, false);
        } else toastr.error(res.message || "save failed");
      },
      error: () => toastr.error("Failed to save"),
    });
  });

  // --- Edit ---
  $("#translations_config").on("click", ".edit-btn", function () {
    const id = $(this).data("id");

    if (!id) {
      toastr.error("Invalid translation manager ID");
      return;
    }

    window.location.href = `/addtranslationkey/${id}`;
  });

  // --- Delete ---
  $("#translations_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");
    Swal.fire({
      title: "Are you sure?",
      text: "This Translation Manager will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (!result.isConfirmed) return;
      $.ajax({
        url: `/deletetranslationmanagers/${id}`,
        type: "DELETE",
        success: (res) => {
          if (res.success) {
            toastr.success(res.message || "Deleted successfully");
            table.ajax.reload(null, false);
          } else toastr.error(res.message || "Delete failed");
        },
        error: () => toastr.error("Failed to delete"),
      });
    });
  });

  // --- Toggle Status ---
  $("#translations_config").on("click", ".status-btn", function () {
    const id = $(this).data("id");
    $.post(`/translationmanagerstatus/${id}`, {}, (res) => {
      if (res.success) {
        toastr.success(res.message || "Status updated");
        table.ajax.reload(null, false);
      } else {
        toastr.error(res.message || "Status update failed");
      }
    });
  });
});
