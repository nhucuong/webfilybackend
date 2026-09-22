$(document).ready(function () {
  const $featureBox = $("#featureBox");

  const rawData = $("#pricingForm").attr("data-features");
  let storedFeatures = {};
  try {
    storedFeatures = JSON.parse(rawData) || {};
  } catch (e) {
    storedFeatures = {};
  }

  const definedFeatures = {
    logoFaviconUpload: "Logo & Favicon Upload",
    regenerateWebsite: "Regenerate Website",
    regenerateContent: "Regenerate Content",
    reorderSection: "Reorder Section",
    exportCode: "Export Code",
    editContent: "Edit Content",
  };

  function renderFixedFeatures() {
    $featureBox.empty();

    Object.keys(definedFeatures).forEach((key) => {
      const label = definedFeatures[key];

      const Checked = storedFeatures[key]
        ? storedFeatures[key].status
        : false;

      const html = `
        <div class="row mb-3 feature-row align-items-center  pb-2">
          
          <!-- Label (Read Only) -->
          <div class="col-md-6">
             <span class="fw-semibold text-dark">${label}</span>
             <!-- Hidden input to store label -->
             <input type="hidden" class="feature-label" value="${label}">
             <!-- Hidden input to store key -->
             <input type="hidden" class="feature-key" value="${key}">
          </div>

          <div class="col-md-3 text-center">
  <div class="form-check form-switch form-check-inline">
    <input type="checkbox" class="form-check-input featureStatus" role="switch"
           id="statusSwitch" ${Checked ? "checked" : ""}>
  </div>
</div>



        </div>
      `;

      $featureBox.append(html);
    });
  }

  renderFixedFeatures();
  const monthly = document.getElementById("monthlyPrice");
  const yearly = document.getElementById("yearlyPrice");

  function isFreePlanUpdate(ele) {
    // dono discount fields ko hamesha non-required rakho
    $("[name='monthlyDiscount'], [name='yearlyDiscount']").prop("required", false);

    if ($(ele).is(":checked")) {
      $(".isFreeHidden").hide();

      $(".isFreeHidden")
        .find("input")
        .not("[name='monthlyDiscount'], [name='yearlyDiscount']")
        .prop("required", false);
      monthly.value = "";
      yearly.value = "";
    } else {
      $(".isFreeHidden").show();

      $(".isFreeHidden")
        .find("input")
        .not("[name='monthlyDiscount'], [name='yearlyDiscount']")
        .prop("required", true);
    }
  }

  $("#isFreePlan").on("change", function () {
    isFreePlanUpdate(this)
  });
  isFreePlanUpdate("#isFreePlan")



  const checkbox = document.getElementById("isFreePlan");

  function checkFree() {
    if ((monthly.value != "" && Number(monthly.value) === 0) || (yearly.value != "" && Number(yearly.value) === 0)) {
      checkbox.checked = true;
      $("#isFreePlan").trigger("change");
    } else {
      checkbox.checked = false;
    }
  }

  monthly.addEventListener("blur", checkFree);
  yearly.addEventListener("blur", checkFree);

  $("#pricingForm").on("submit", function (e) {
    e.preventDefault();
    const form = this;
    const submitBtn = $(form).find("button[type='submit']");
    const originalText = submitBtn.html();

    if (!form.checkValidity()) {
      $(form).addClass("was-validated");
      return;
    }

    submitBtn
      .prop("disabled", true)
      .html(
        `<span class="spinner-border spinner-border-sm me-2"></span> Saving...`,
      );

    const featuresObj = {};

    $(".feature-row").each(function () {
      const key = $(this).find(".feature-key").val();
      const label = $(this).find(".feature-label").val();
      const featureStatus = $(this).find(".featureStatus").is(":checked");

      featuresObj[key] = {
        label: label,
        status: featureStatus
      };
    });

    const formData = $(form).serializeArray();

    formData.push({ name: "features", value: JSON.stringify(featuresObj) });

    $.ajax({
      url: "/subscriptionsave",
      type: "POST",
      data: formData,
      success: function (res) {
        if (res.success) {
          toastr.success(res.message);
          setTimeout(() => {
            window.location.href = "/subscriptionplan";
          }, 1500);
        } else {
          toastr.error(res.message);
          submitBtn.prop("disabled", false).html(originalText);
        }
      },
      error: function () {
        toastr.error("Server error");
        submitBtn.prop("disabled", false).html(originalText);
      },
    });
  });
});
