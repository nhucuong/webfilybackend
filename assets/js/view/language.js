$(document).ready(function () {

    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "3000"
    };

    const modal = new bootstrap.Modal(
        document.getElementById("languaeModal")
    );

    if ($.fn.DataTable.isDataTable("#language_config")) {
        $("#language_config").DataTable().clear().destroy();
    }

    const table = $("#language_config").DataTable({
        responsive: true,
        autoWidth: false,
        searching: true,
        ajax: { url: "/languagejson", dataSrc: "data" },
        columns: [
            { data: "name" },
            {
        data: "status",
        className: "text-center",
        render: function (data) {
          if (data === true) {
            return '<span class="badge bg-success">Enabled</span>';
          }
          if (data === false) {
            return '<span class="badge bg-danger">Disabled</span>';
          }
        }
      },
            {
                data: null,
                className: "text-center",
                render: (row) =>{ 
                    if (row?.code === "en") {
        return "";
    }
    return `
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
                    </ul>
                </div>`}
            }
        ],
        order:[]
    });

    /* ================= ADD ================= */
    $("#addlanguageBtn").click(() => {
        $("#languageForm")[0].reset();
        $("#languageId").val("");
        $("#languageStatus").prop("checked", true);
        $("#languageModalLabel").text("Add Language");
        modal.show();
    });

    /* ================= SAVE / UPDATE ================= */
    $("#languageForm").submit(function (e) {
        e.preventDefault();

        const $btn = $(this).find("button[type='submit']");
        const btnHtml = $btn.html();
        

        $btn.prop("disabled", true).html(
            `<span class="spinner-border spinner-border-sm"></span>`
        );

        const payload = {
            name: $("#languageName").val(),
            code: $("#languageCode").val(),
            native: $("#languageNative").val(),
            flag: $("#languageFlag").val(),
            status: $("#languageStatus").is(":checked") ? "true" : "false "
        };

        const id = $("#languageId").val();
        if (id) payload.id = id;

        $.ajax({
            url: "/languagesave",
            type: "POST",
            data: payload,
            success: (res) => {
                $btn.prop("disabled", false).html(btnHtml);

                if (res.success) {
                    toastr.success(res.message || "Saved successfully");
                    modal.hide();
                    table.ajax.reload(null, false);
                } else {
                    toastr.error(res.message || "Save failed");
                }
            },
            error: () => {
                $btn.prop("disabled", false).html(btnHtml);
                toastr.error("Something went wrong");
            }
        });
    });

    /* ================= EDIT ================= */
    $("#language_config").on("click", ".edit-btn", function () {
        const row = table.row($(this).closest("tr")).data();
        if (!row) return toastr.error("Data not found");

        $("#languageId").val(row._id);
        $("#languageName").val(row.name);
        $("#languageCode").val(row.code);
        $("#languageNative").val(row.native);
        $("#languageFlag").val(row.flag);
         $("#languageStatus").prop("checked", row.status);
        $("#languageModalLabel").text("Edit Language");
        modal.show();
    });

    /* ================= DELETE ================= */
    $("#language_config").on("click", ".delete-btn", function () {
        const id = $(this).data("id");

          Swal.fire({
    title: "Are you sure?",
    text: "This Languaege will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;
        $.ajax({
            url: `/languagedelete/${id}`,
            type: "DELETE",
            success: (res) => {
                if (res.success) {
                    toastr.success(res.message || "Deleted");
                    table.ajax.reload(null, false);
                } else {
                    toastr.error(res.message || "Delete failed");
                }
            },
            error: () => toastr.error("Delete failed")
        });
    });
      });

});
