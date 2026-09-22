$(document).ready(function () {

  function addSectionFeature(value = "") {
    $("#sectionFeatureContainer").append(`
      <div class="input-group mb-2 section-feature-row">
        <input type="text"
               class="form-control sectionFeatureInput"
               placeholder="Enter feature"
               value="${value}">
        <button type="button"
                class="btn btn-outline-danger removeSectionFeatureBtn">
          <i class="fa fa-minus"></i>
        </button>
      </div>
    `);
  }

  // ===== Load existing labels from data attribute =====
  const existingLabelsStr = $("#sectionForm").attr("data-existing-labels") || "[]";
  let existingLabels = [];
  try {
    existingLabels = JSON.parse(existingLabelsStr);
  } catch (e) {
    existingLabels = [];
  }

  if (existingLabels.length > 0) {
    existingLabels.forEach(label => addSectionFeature(label));
  } else {
    addSectionFeature(""); // default one empty field
  }

  $("#addSectionFeatureBtn").on("click", () => addSectionFeature(""));

  $("#sectionFeatureContainer").on("click", ".removeSectionFeatureBtn", function () {
    $(this).closest(".section-feature-row").remove();
    if ($(".sectionFeatureInput").length === 0) addSectionFeature("");
  });

  // ===== Form submission =====
$("#sectionForm").submit(function (e) {
    e.preventDefault();
    const form = this;

    const labels = [];
    $(".sectionFeatureInput").each(function () {
        const val = $(this).val().trim();
        if (val) labels.push(val);
    });

    // Use jQuery to safely get values
    const data = {
        type: $(form).find("[name='type']").val()?.trim() || "",
        badge: $(form).find("[name='badge']").val()?.trim() || "",
        title: $(form).find("[name='title']").val()?.trim() || "",
        shortDescription: $(form).find("[name='shortDescription']").val()?.trim() || "",
        special: $(form).find("[name='special']").val()?.trim() || "",
        subtitle: $(form).find("[name='subtitle']").val()?.trim() || "",
        labels: JSON.stringify(labels)
    };

    const $submitBtn = $(form).find("button[type='submit']");
    const originalBtnContent = $submitBtn.html();
    $submitBtn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm"></span>`);

    $.ajax({
        url: "/savesection",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: res => {
            $submitBtn.prop("disabled", false).html(originalBtnContent);
            if (res.success) toastr.success(res.message || "Saved successfully");
            else toastr.error(res.message || "Something went wrong");
        },
        error: () => {
            $submitBtn.prop("disabled", false).html(originalBtnContent);
            toastr.error("Server error");
        }
    });
});

});
