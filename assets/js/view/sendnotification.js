$(document).ready(function () {
   $('#summernoteEditor').summernote({
        placeholder: 'Write your email content here...',
        tabsize: 2,
        height: 400, // Editor height
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ]
    });

    // 2. Default Colorful HTML Template (Inline CSS for Emails)
    var defaultTemplate = `
        <div style="background-color:#f4f6f8; padding:30px; font-family:Arial, sans-serif;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background:#0d6efd; padding:24px; text-align:center; color:#ffffff;">
                    <h1 style="margin:0; font-size:24px;">Weblify</h1>
                    <p style="margin:5px 0 0; color:#e0e7ff; font-size:14px;">System Notification</p>
                </div>

                <!-- Body -->
                <div style="padding:30px; color:#333333; line-height:1.6;">
                    <p>This is a notification from <strong>Weblify</strong>.</p>
                    
                    <div style="background:#f8faff; border-left:4px solid #0d6efd; padding:15px; margin:20px 0;">
                        Write your message here...
                    </div>

                    <p>Please log in to your dashboard for more details.</p>
                    
                    <p style="margin-top:30px;">
                        Regards,<br>
                        <strong>Weblify Team</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background:#f1f3f5; padding:15px; text-align:center; font-size:12px; color:#888;">
                    © Weblify — All rights reserved
                </div>
            </div>
        </div>
    `;

    $('#summernoteEditor').summernote('code', defaultTemplate);

    $("#specificUsers").select2({
        width: "100%",
        placeholder: "Select users...",
        allowClear: true
    });

    $("#sentToEmail").change(function () {
        if ($(this).val() === "specific") {
            $("#specificUsersWrapper").removeClass("d-none");
            loadUsersList();
        } else {
            $("#specificUsersWrapper").addClass("d-none");
        }
    });

    function loadUsersList() {
        $.get("/fetch-users-email", function (res) {
            if (res.success) {
                let html = "";

                res.users.forEach(u => {
                    html += `<option value="${u.email}">${u.firstName} ${u.lastName} (${u.email})</option>`;
                });

                $("#specificUsers").html(html);
                $("#specificUsers").trigger("change");
            }
        });
    }

        $("form").submit(function (e) {
        e.preventDefault();
        
        // Sync Quill content to hidden textarea
var fullHtml = $('#summernoteEditor').summernote('code');
        const data = {
            type: $("#sentToEmail").val(),
            subject: $("#subjectEmail").val(),
            message: fullHtml, // Pura HTML design bhej rahe hain
            users: $("#specificUsers").val() || []
        };

    const $submitBtn = $(this).find("button[type='submit']");
    const originalBtnContent = $submitBtn.html();
    $submitBtn.prop("disabled", true);
    $submitBtn.html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`);

        $.post("/send-email", data, function (res) {
              $submitBtn.prop("disabled", false).html(originalBtnContent);
            if (res.success) {
                   toastr.success(res.message || "Success");
                $('#summernoteEditor').summernote('code', defaultTemplate);
                $("#subjectEmail").val("");
            } else {
                toastr.error(res.message || "error");
            }
        });
    });
});