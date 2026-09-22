$(document).ready(function () {

    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "3000"
    };

    const modal = new bootstrap.Modal(
        document.getElementById("herostatModal")
    );

    if ($.fn.DataTable.isDataTable("#herostat_config")) {
        $("#herostat_config").DataTable().clear().destroy();
    }

    const table = $("#herostat_config").DataTable({
        responsive: true,
        autoWidth: false,
        searching: false,
        ajax: { url: "/herostatsjson", dataSrc: "data" },
        columns: [
            { data: "label" },
            {
                data: "iconName",
                render: (icon) => `<i class="fa ${icon} fs-4"></i> ${icon}`
            },
            {
                data: "count",
                render: (count) => `<span class="badge bg-primary fs-2">${count}</span>`
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
                    </ul>
                </div>`
            }
        ],
        order:[]
    });

    /* ================= ADD ================= */
    $("#addherostatBtn").click(() => {
        $("#herostatForm")[0].reset();
        $("#herostatId").val("");
        $("#herostatModalLabel").text("Add Stat");
        modal.show();
    });

    /* ================= SAVE / UPDATE ================= */
    $("#herostatForm").submit(function (e) {
        e.preventDefault();

        const $btn = $(this).find("button[type='submit']");
        const btnHtml = $btn.html();

        $btn.prop("disabled", true).html(
            `<span class="spinner-border spinner-border-sm"></span>`
        );

        const payload = {
            label: $("#herostatLabel").val(),
            iconName: $("#iconName").val(),
            count: $("#herostatCount").val()
        };

        const id = $("#herostatId").val();
        if (id) payload.id = id;

        $.ajax({
            url: "/herostatssave",
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
    $("#herostat_config").on("click", ".edit-btn", function () {
        const row = table.row($(this).closest("tr")).data();
        if (!row) return toastr.error("Data not found");

        $("#herostatId").val(row._id);
        $("#herostatLabel").val(row.label);
        $("#iconName").val(row.iconName);
        $("#herostatCount").val(row.count);

        $("#herostatModalLabel").text("Edit Stat");
        modal.show();
    });

    /* ================= DELETE ================= */
    $("#herostat_config").on("click", ".delete-btn", function () {
        const id = $(this).data("id");

          Swal.fire({
    title: "Are you sure?",
    text: "This Stat will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;
        $.ajax({
            url: `/herostatsdelete/${id}`,
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
