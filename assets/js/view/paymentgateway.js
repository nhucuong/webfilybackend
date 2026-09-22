$(document).ready(function () {
  
  
  const modal = new bootstrap.Modal("#gatewayModal");

  // Destroy if exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    ajax: { url: "/paymentgatewayjson", dataSrc: "data" },
    autoWidth: false,
    columns: [
      { data: "name" },
      { data: "fixedCharge" },
      {
        data: "enabled",
        render: (val) => {
          return val
            ? `<span class="badge bg-success">Enabled</span>`
            : `<span class="badge bg-danger">Disabled</span>`;
        }
      },
      {
        data: null,
        render: (row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <button class="dropdown-item edit" data-id="${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>
            </ul>
          </div>
        `
      }
    ]
  });

const webhookNotes = {
    paypal: "Enter your PayPal Webhook ID for payment verification.",
    stripe: "Enter your Stripe Webhook Secret Key for payment verification.",
    razorpay: "Enter your Razorpay Webhook Secret Key for payment verification.",
  };

  const defaultWebhookNote =
    "Webhook configuration is required for secure payment verification.";

const webhookLabel = {
    paypal: "Webhook ID",
    stripe: "Webhook Secret Key",
    razorpay: "Webhook Secret Key",
  };

  const defaultWebhookLabel =
    "Webhook";

  // ✅ Create it here
  function updateWebhookNote(name) {
    name = (name || "").toLowerCase();

    const note = webhookNotes[name] || defaultWebhookNote;
    const label = webhookLabel[name] || defaultWebhookLabel;

    $("#webhookNote").html(`
      <strong>Note:</strong> ${note}
    `);
    $("#webhooklabel").html(`
      ${label} <span class="text-danger">*</span>
    `);
  }


  // ✅ Enabled Label
  function updateEnabledLabel() {
    $("#enabledLabel").text($("#enabled").is(":checked") ? "Enabled" : "Disabled");
  }

  $("#enabled").on("change", updateEnabledLabel);

  // 🔥 Gateway Field Handler
 function handleGatewayFields(name, row = {}) {
  name = (name || "").toLowerCase();

  // Reset UI
  $("#clientIdWrapper").hide();
  $("#secretKeyWrapper").show();
  $("#publicKeyWrapper").addClass("d-none");
  $("#privateKeyWrapper").addClass("d-none");
  $("#webhookwrapper").show();
  // Reset required
  $("#secretKey").prop("required", false);
  $("#publicKey").prop("required", false);
  $("#privateKey").prop("required", false);

  // Default labels
  $("#clientIdLabel").html('Client ID<span class="text-danger">*</span>');
  $("#secretKeyLabel").html('Secret Key <span class="text-danger">*</span>');

  // Fill values
  $("#clientId").val(row.clientId || "");
  $("#secretKey").val(row.secretKey || "");
  $("#publicKey").val(row.publicKey || "");
  $("#privateKey").val(row.privateKey || "");

  // 🔥 Gateway-wise config
  if (name === "paypal") {
    $("#clientIdWrapper").show();
    $("#clientIdLabel").html('Client ID<span class="text-danger">*</span>');
    $("#secretKeyLabel").html('Secret Key<span class="text-danger">*</span>');
    $("#secretKey").prop("required", true);
  }

  else if (name === "razorpay") {
    $("#clientIdWrapper").show();
    $("#clientIdLabel").html('Client ID<span class="text-danger">*</span>');
    $("#secretKeyLabel").html('Secret Key<span class="text-danger">*</span>');
    $("#secretKey").prop("required", true);
  }

  else if (name === "braintree") {
    $("#clientIdWrapper").show();
    $("#secretKeyWrapper").hide();
    $("#webhookwrapper").hide();

    $("#clientIdLabel").html('Merchant ID<span class="text-danger">*</span>');

    $("#publicKeyWrapper").removeClass("d-none");
    $("#privateKeyWrapper").removeClass("d-none");

    $("#publicKey").prop("required", true);
    $("#privateKey").prop("required", true);
  }

  else if (name === "payhere") {
    $("#clientIdWrapper").show();
    $("#clientIdLabel").text("Merchant ID");
    $("#secretKeyLabel").html('Merchant Secret<span class="text-danger">*</span>');
    $("#secretKey").prop("required", true);
  }

  else if (name === "stripe") {
    $("#clientIdWrapper").hide();
    $("#secretKeyLabel").html('Secret Key<span class="text-danger">*</span>');
    $("#secretKey").prop("required", true);
  }

   updateWebhookNote(name);


}

  // 🔥 Submit
  $("#gatewayForm").submit(function (e) {
    e.preventDefault();

    const id = $("#gatewayId").val();
    const name = ($("#name").val() || "").toLowerCase().trim();

    // 🔥 Always reset before mapping
    let clientId = ($("#clientId").val() || "").trim();
    let secretKey = ($("#secretKey").val() || "").trim();
    let publicKey = ($("#publicKey").val() || "").trim();
    let privateKey = ($("#privateKey").val() || "").trim();

    // 🔥 Mapping (same as backend)
    if (name !== "braintree") {
  publicKey = "";
  privateKey = "";
}

    $.post(`/savepaymentgateway/${id}`, {
      name,
      iconName: $("#iconName").val(),
      secretKey,
      publicKey,
      privateKey,
      webhookUrl: $("#webhookUrl").val(),
      fixedCharge: $("#fixedCharge").val(),
      clientId,
      enabled: $("#enabled").is(":checked")
    }, (res) => {
      if (res.success) {
        toastr.success(res.message || "Saved successfully");
        modal.hide();
        table.ajax.reload();
      } else {
        toastr.error(res.message || "Save failed");
      }
    }).fail(() => {
      toastr.error("Something went wrong");
    });
  });

  // 🔥 Default state
  $("#clientIdWrapper").hide();

  // ✅ EDIT
  $("#zero_config").on("click", ".edit", function () {
    const row = table.row($(this).parents("tr")).data();

    // Reset form first (IMPORTANT)
    $("#gatewayForm")[0].reset();

    $("#gatewayId").val(row._id);
    $("#name").val(row.name).prop("readonly", true);

    $("#iconName").val(row.iconName);
    $("#webhookUrl").val(row.webhookUrl);
    $("#fixedCharge").val(row.fixedCharge);
    $("#enabled").prop("checked", row.enabled === true);

    handleGatewayFields(row.name, row);

    updateEnabledLabel();
    modal.show();
  });

});