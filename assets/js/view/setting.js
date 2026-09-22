toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  timeOut: "3000"
};
function loadContact() {
  $.get("/getSettingjson", function (res) {
    if (res.success && res.data) {

      $("#contactId").val(res.data._id);
      $("#companyName").val(res.data.companyName);
      $("#contactAddress").val(res.data.contactAddress);
      $("#contactNumber").val(res.data.contactNumber);
      $("#emailAddress").val(res.data.emailAddress);
      $("#googleMapLink").val(res.data.mapUrl);
      $("#currency").val(res.data.currency || "");
      $("#currencySymbol").val(res.data.currencySymbol || "");
      $("#facebook").val(res.data.facebook || "");
      $("#instagram").val(res.data.instagram || "");
      $("#twitter").val(res.data.twitter || "");
      $("#linkedin").val(res.data.linkedin || "");
      $("#youtube").val(res.data.youtube || "");
      $("#email").val(res.data.email || "");
      $("#password").val(res.data.password || "");
      $("#aboutcompany").val(res.data.aboutcompany || "");
      $("#supportTime").val(res.data.supportTime || "");
      // THEME COLORS
      $("#primaryColor").val(res.data.theme?.primaryColor || "#6B4FE6");
$("#secondaryColor").val(res.data.theme?.secondaryColor || "#795EFE");
      loadlanguages(res.data.defaultLanguages);
      if (res.data.logo) $("#logoPreview").attr("src", res.data.logo);
      if (res.data.favicon) $("#faviconPreview").attr("src", res.data.favicon);

    }

  });
}

// --- Load Languages into dropdown ---
  function loadlanguages(selectedId) {
  $.get("/gettranslationmanagerjson", (res) => {
    if (res.success) {
      let options = '<option disabled>Select Language</option>';

      res.data.forEach((c) => {
        options += `
          <option value="${c.code}"
            ${c.code === selectedId ? "selected" : ""}>
            ${c.languageName} (${c.code})
          </option>
        `;
      });

      $("#defaultLanguageSelect").html(options);
    }
  });
}

loadContact();
// LOGO PREVIEW
$("#logo").on("change", function () {
  const file = this.files[0];
  if (file) $("#logoPreview").attr("src", URL.createObjectURL(file));
});

$("#favicon").on("change", function () {
  const file = this.files[0];
  if (file) {
    $("#faviconPreview").attr("src", URL.createObjectURL(file));
    $("#contactForm").append('<input type="hidden" name="faviconUpdated" value="1">');
  }
});


$("#contactForm").on("submit", function (e) {
  e.preventDefault();

  let formData = new FormData(this);

  formData.set("primaryColor", $("#primaryColor").val());
formData.set("secondaryColor", $("#secondaryColor").val());

  formData.set(
  "defaultLanguages",
  $("#defaultLanguageSelect").val()
);

  // remove logo if no new file
  if ($("#logo")[0].files.length === 0) formData.delete("logo");
  if ($("#favicon")[0].files.length === 0) formData.delete("favicon");


  $.ajax({
    url: "/saveSetting",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,

    success: function (res) {


      if (!res.success) {
        toastr.error(res.msg || res.message || "Something went wrong!");
        return;
      }

      //  SUCCESS
      toastr.success(res.msg || "Saved successfully");
      loadContact();
      loadlanguages()
    },

    error: function (xhr) {
      const res = xhr.responseJSON;
      toastr.error(res?.msg || res?.message || "Server error");

    }
  });
});
