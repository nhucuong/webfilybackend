$(document).ready(function () {

    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "3000"
    };

    $("#saveBtn").on("click", function () {

        const btn = $(this);
        btn.prop("disabled", true).text("Saving...");

        const data = {
            google: {
                enabled: $('.provider-enabled[data-provider="google"]').is(":checked"),
                apiKey: $('.auth-input[data-provider="google"][data-field="apiKey"]').val().trim(),
                apiSecretKey: $('.auth-input[data-provider="google"][data-field="apiSecretKey"]').val().trim(),
                apiRedirectUrl: $('.auth-input[data-provider="google"][data-field="apiRedirectUrl"]').val().trim()
            },

            github: {
                enabled: $('.provider-enabled[data-provider="github"]').is(":checked"),
                apiKey: $('.auth-input[data-provider="github"][data-field="apiKey"]').val().trim(),
                apiSecretKey: $('.auth-input[data-provider="github"][data-field="apiSecretKey"]').val().trim(),
                apiRedirectUrl: $('.auth-input[data-provider="github"][data-field="apiRedirectUrl"]').val().trim()
            }
        };

        $.ajax({
            url: "/saveauthsetting",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),

            success: function (res) {

                btn.prop("disabled", false).text("Save Changes");

                if (res.success) {
                    toastr.success(res.message || "Settings saved successfully");
                } else {
                    toastr.error(res.message || "Something went wrong");
                }
            },

            error: function (xhr) {

                btn.prop("disabled", false).text("Save Changes");

                toastr.error(
                    xhr.responseJSON?.message ||
                    "Failed to save settings"
                );
            }
        });

    });

});