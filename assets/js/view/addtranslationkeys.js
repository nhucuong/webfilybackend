$(document).ready(function () {
  const modal = new bootstrap.Modal(
    document.getElementById("translationkeyModal")
  );

  const translationManagerId = $("#translationManagerId").val();
  let allTranslations = [];

  if (!translationManagerId) {
    console.error("Missing translation manager ID");
    return;
  }

  console.log("ID:", translationManagerId);

  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000",
  };

  const table = $("#zero_config").DataTable({
    responsive: true,
    autoWidth: false,
    searching: true,
    ajax: {
      url: `/gettranslationmanagerkeys/${translationManagerId}`,
      dataSrc: function (json) {
        allTranslations = json.data.translations || [];
        return allTranslations;
      },
    },
    columns: [
      {
        data: "key",
        title: "Key",
      },
      {
        data: "value",
        title: "Value",
        render: (data, type, row) => `
          <input
            type="text"
            class="form-control translation-value"
            data-key="${row.key}"
            value="${data || ""}"
          />
        `,
      },
    ],
    order: [],
  });

  $(document).on("input", ".translation-value", function () {
    const key = $(this).data("key");
    const value = $(this).val();

    const item = allTranslations.find(
      (t) => t.key === key
    );

    if (item) {
      item.value = value;
    }
  });

  // ========== ADD TAG BUTTON ==========
  $("#addkeyBtn").click(() => {
    $("#translationkeysForm")[0].reset();
    $("#translationKeyId").val("");

    $("#translationkeyModalLabel").text(
      "Add Translation Key"
    );

    modal.show();
  });

  // ========== SUBMIT FORM ==========
  $("#translationkeysForm").submit(function (e) {
    e.preventDefault();

    const data = {
      id: $("#translationKeyId").val(),
      languageId: translationManagerId,
      key: $("#translationKey").val().trim(),
      value: $("#translationvalue").val().trim(),
    };

    $.ajax({
      url: "/translationnewkeyadd",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),

      success: (res) => {
        if (res.success) {
          toastr.success(
            res.message || "Translation Key Saved"
          );

          modal.hide();

          $("#translationkeysForm")[0].reset();

          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message);
        }
      },

      error: (xhr) => {
        toastr.error(
          xhr.responseJSON?.message ||
            "Something went wrong"
        );
      },
    });
  });

  $("#updateAllTranslations").click(function () {
    $.ajax({
      url: "/savetranslationmanagerkeys",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        id: translationManagerId,
        translation: allTranslations,
      }),

      success: function (res) {
        if (res.success) {
          toastr.success(
            res.message || "Translations Updated"
          );

          table.ajax.reload(null, false);
        } else {
          toastr.error(res.message);
        }
      },

      error: function (xhr) {
        toastr.error(
          xhr.responseJSON?.message ||
            "Failed to update translations"
        );
      },
    });
  });

}); // <- document.ready closing