
$(document).ready(function () {

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  const modal = new bootstrap.Modal($("#howItWorkModal")[0]);

  // ===============================
  // DATATABLE
  // ===============================
  const table = $("#howItWorkTable").DataTable({
    responsive: true,
    autoWidth: false,
    searching: false,
    ajax: { url: "/howitworkjson", dataSrc: "data" },
    columns: [
      {
        data: "image",
        render: img =>
          img
            ? `<img src="${img}" width="80" height="50" class="rounded border" style="object-fit: cover;">`
            : "<span class='text-muted'>No Image</span>"
      },
      { data: "iconName" },
      { data: "title" },
      {
        data: "description",
        render: function (data) {
          if (!data) return "";

          const shortText = data.length > 45
            ? data.substring(0, 40) + "..."
            : data;

          return `
      <span title="${data.replace(/"/g, '&quot;')}">
        ${shortText}
      </span>
    `;
        }
      },
      {
        data: null,
        className: "text-center",
        render: row => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
                <li>
                <button class="dropdown-item edit-btn">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>

              <li>
                <button class="dropdown-item delete-btn">
                  <i class="fa-solid fa-trash text-danger me-2"></i>Delete
                </button>
              </li>

            </ul>
          </div>
        `
      }
    ],
    order: [],
  });

  // ===============================
  // FEATURE (LABEL) ADD MORE
  // ===============================
  function addFeatureField(value = "") {
    $("#featureContainer").append(`
      <div class="input-group mb-2 feature-row">
        <input type="text" class="form-control featureInput"
               placeholder="Enter feature" value="${value}" required>
        <button class="btn btn-outline-danger removeFeatureBtn" type="button">
          <i class="fa fa-minus"></i>
        </button>
      </div>
    `);
  }

  $("#addFeatureBtn").on("click", () => addFeatureField());

  $("#featureContainer").on("click", ".removeFeatureBtn", function () {
    $(this).closest(".feature-row").remove();

    if ($(".featureInput").length === 0) {
      addFeatureField("");
    }
  });

  // ===============================
  // IMAGE PREVIEW
  // ===============================
  $("#imageInput").on("change", function () {
    const reader = new FileReader();
    reader.onload = e => $("#previewImg").attr("src", e.target.result).show();
    reader.readAsDataURL(this.files[0]);
  });

  // ===============================
  // ADD NEW
  // ===============================
  $("#addHowItWorkBtn").click(() => {
    $("#howItWorkForm")[0].reset();
    $("#howItWorkId").val("");
    $("#featureContainer").html("");
    addFeatureField("");
    $("#previewImg").hide();
      $("#howitworktitle").text("Add How It Works");
    modal.show();
  });

  // ===============================
  // SUBMIT (ADD / UPDATE)   HERO STYLE
  // ===============================
  $("#howItWorkForm").on("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    const features = [];
    $(".featureInput").each(function () {
      const val = $(this).val().trim();
      if (val) features.push(val);
    });

    //  SAME AS HERO LABELS
    formData.append("features", JSON.stringify(features));

    const $btn = $("#howItWorkForm button[type='submit']");
    const old = $btn.html();
    $btn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm"></span>`);

    $.ajax({
      url: "/howitworksave",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: res => {
        $btn.prop("disabled", false).html(old);
        if (res.success) {
          toastr.success(res.message);
          $("#howItWorkModal").modal("hide");
          $("#howItWorkTable").DataTable().ajax.reload(null, false);
        } else {
          toastr.error(res.message);
        }
      },
      error: () => {
        $btn.prop("disabled", false).html(old);
        toastr.error("Something went wrong");
      }
    });
  });


  // ===============================
  // EDIT IMAGE + FEATURES FIXED
  // ===============================
  $("#howItWorkTable").on("click", ".edit-btn", function () {
    const row = $("#howItWorkTable").DataTable()
      .row($(this).parents("tr"))
      .data();

    $("#howItWorkForm")[0].reset();
    $("#imageInput").val("");
    $("#previewImg").hide().attr("src", "");

    $("#howItWorkId").val(row._id);
    $("#iconName").val(row.iconName || "");
    $("#title").val(row.title || "");
    $("#description").val(row.description || "");

    $("#featureContainer").html("");

    //  EXACT HERO LABEL LOGIC
    if (Array.isArray(row.features) && row.features.length > 0) {
      row.features.forEach(f => addFeatureField(f));
    } else {
      addFeatureField("");
    }

    if (row.image) {
      $("#previewImg").attr("src", row.image).show();
    } else {
      $("#previewImg").hide();
    }
       $("#howitworktitle").text("Edit How It Works");
    $("#howItWorkModal").modal("show");
  });

  // ===============================
  // DELETE
  // ===============================
  $("#howItWorkTable").on("click", ".delete-btn", function () {
    const row = table.row($(this).parents("tr")).data();
 
      Swal.fire({
    title: "Are you sure?",
    text: "This How It Works item will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel"
  }).then((result) => {

    if (!result.isConfirmed) return;

    $.ajax({
      url: `/howitworkdelete/${row._id}`,
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

  // ===============================
  // AI DESCRIPTION (HOW IT WORK)
  // ===============================
  $("#generateHowItWorkAI").on("click", function () {
    const title = $("#title").val().trim();

    if (!title) {
      toastr.error("Please enter title first");
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
      data: JSON.stringify({
        name: title,
        prompt: "Generate a professional how it works step description in 25 words"
      }),
      success: res => {
              toastr.clear(loadingToast);
        if (!res.success) return toastr.error(res.message || "AI failed");
        $("#description").val(res.description);
        toastr.success("Description generated");
      },
      error: () =>{
              toastr.clear(loadingToast);
        toastr.error("AI generation failed")
      }
    });
  });

});
