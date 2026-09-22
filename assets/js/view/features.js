$(document).ready(function () {

  // ===============================
  // TOASTR CONFIG
  // ===============================
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  // ===============================
  // MODAL
  // ===============================
  const featureModal = new bootstrap.Modal(
    document.getElementById("featureModal")
  );

  // ===============================
  // RESET DATATABLE
  // ===============================
  if ($.fn.DataTable.isDataTable("#Features_config")) {
    $("#Features_config").DataTable().clear().destroy();
  }

  const table = $("#Features_config").DataTable({
    responsive: true,
    autoWidth: false,
    searching: false,
    ajax: { url: "/Featuresjson", dataSrc: "data" },
    columns: [
      {
        data: "iconName",
        render: icon => icon || "<span class='text-muted'>N/A</span>"
      },
      {
        data: "title",
        render: t => t || "<span class='text-muted'>N/A</span>"
      },
      {
        data: "description",
        render: d => {
          if (!d) return "<span class='text-muted'>N/A</span>";
          return d.length > 50 ? d.substring(0, 50) + "..." : d;
        }
      },
      {
        data: null,
        className: "text-center",
        render: row => `
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
    order: []
  });

  // ===============================
  // ADD FEATURE
  // ===============================
  $("#addFeatureBtn").click(() => {
    $("#featureForm")[0].reset();
    $("#featureId").val("");
    $("#featureModalLabel").text("Add Feature");
    featureModal.show();
  });


// ===============================
// AI GENERATE FEATURE DESCRIPTION
// ===============================
$("#generateAIFeature").click(() => {
  const title = $("#featureTitle").val().trim();

  if (!title) {
    toastr.warning("Please enter Title first");
    return;
  }

  const loadingToast = toastr.info(
        "AI is writing description...",
        "Please wait",
        { timeOut: 0, extendedTimeOut: 0 }
    );

  $.ajax({
    url: "/generateDescription",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ name: title,prompt:'Write a concise, engaging, and professional description for a product or service feature in simple English. Focus on benefits and key points, no fluff, STRICT LIMIT: exactly 150 characters maximum (not even 151). No extra text.' }),
    success: res => {5
            toastr.clear(loadingToast);

      if (!res.success) {
        toastr.error(res.message || "AI failed");
        return;
      }

      const fullDesc = res.description;
      const shortDesc =
        fullDesc.split(" ").slice(0, 35).join(" ") + "...";

      $("#featureDescription").val(shortDesc);

      toastr.success("Description generated successfully");
    },
    error: () => {
            toastr.clear(loadingToast);
      toastr.error("AI generation failed");
    }
  });
});



  // ===============================
  // SAVE / UPDATE FEATURE
  // ===============================
  $("#featureForm").submit(function (e) {
    e.preventDefault();

    const data = {
      id: $("#featureId").val(),
      title: $("#featureTitle").val(),
      description: $("#featureDescription").val(),
      iconName: $("#featureIcon").val()
    };

    const $btn = $("#featureForm button[type='submit']");
    const originalHtml = $btn.html();
    $btn.prop("disabled", true).html(`
      <span class="spinner-border spinner-border-sm"></span> Saving...
    `);

    $.ajax({
      url: "/Featuressave",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: res => {
        $btn.prop("disabled", false).html(originalHtml);

        if (res.success) {
          toastr.success(res.message);
          featureModal.hide();
          $("#featureForm")[0].reset();
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message);
        }
      },
      error: () => {
        $btn.prop("disabled", false).html(originalHtml);
        toastr.error("Something went wrong");
      }
    });
  });

  // ===============================
  // EDIT FEATURE
  // ===============================
  $("#Features_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return toastr.error("Data not found");

    $("#featureId").val(row._id);
    $("#featureTitle").val(row.title);
    $("#featureDescription").val(row.description);
    $("#featureIcon").val(row.iconName);

    $("#featureModalLabel").text("Edit Feature");
    featureModal.show();
  });

  // ===============================
  // DELETE FEATURE
  // ===============================
  $("#Features_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");

      Swal.fire({
    title: "Are you sure?",
    text: "This Feature will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;
    $.ajax({
      url: `/Featuresdelete/${id}`,
      type: "DELETE",
      success: res => {
        if (res.success) {
          toastr.success(res.message);
          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message);
        }
      },
      error: () => toastr.error("Delete failed")
    });
  });
    });

});
